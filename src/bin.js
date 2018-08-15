const Program      = require('commander');
const Path         = require('path');
const Fs           = require('fs');
const Solparser    = require('solidity-parser-sc');

const debug        = require('debug')('contract-graph-generator');

const Solgraph     = require('./index.js');
const Utils        = require('./utils.js');
const pkg          = require('../package.json');

const rootPath     = process.cwd();
let option         = {};
let params         = {};

let contracts      = {};

const extendedHelp = `

${pkg.description}

Example:
$ cat MyContract.sol | solgraph > MyContract.dot

`;

Program.name('solidity-graph-generator').alias('solgraph').usage('[command] [options]').version(pkg.version, '    --version');

let template = `
digraph G {
  fontname = "Bitstream Vera Sans"
  fontsize = 8

  node [
    fontname = "Bitstream Vera Sans"
    fontsize = 8
    shape = "record"
  ]

  edge [
    fontname = "Bitstream Vera Sans"
    fontsize = 8
  ]

`


Program.command('generate')
    .alias('g')
    .description(pkg.description)
    .option('-s, --source  [value]', 'source directory or file path of solidity files')
    .option('-m, --module  [value]', 'node_module path if import modules form node module packages')
    .option('-t, --target  [value]', 'target dot file name')
    .action(function () {
        option = Utils.parseOption(arguments);
        params = Utils.parseParams(arguments);

        const source = Path.join(rootPath, params.source);
        const module = params.module ? Path.join(rootPath, params.module) : "";
        const target = Path.join(rootPath, params.target || '.');

        if (!Utils.isOkFile(source) && !Utils.isOkDirectory(source)) throw new Error('invalid contract source');
        if (module && !Utils.isOkDirectory(module)) throw new Error('invalid node_module directory');
        Utils.mkOutputDirectory(target);

        const solFiles = [];
        const solObjects = {};

        readSolidityFilesPath(source, solFiles);
        // console.log("Files %j", files);

        for (let solFile of solFiles) {
          console.log("Sol File %s", solFile);
          parseSolFile(solFile, solObjects);
        }
        console.log(contracts);
        
        for (let contractName in contracts) {
          if (!contracts.hasOwnProperty(contractName)) continue;
          let contractBlock = contractName + '[label = "{' + contractName + '|';

          contractBlock += contracts[contractName].StateVariableDeclaration + '|';
          contractBlock += contracts[contractName].ModifierDeclaration + '|';
          contractBlock += contracts[contractName].FunctionDeclaration;

          contractBlock += '}"]';

          template += contractBlock;
        }

        template += '}';

        Fs.writeFileSync('demo.dot', template);
    });

Program.parse(process.argv);

function readSolidityFilesPath(source, solFiles) {
  let files;
  if (Utils.isOkDirectory(source)) {
    files = Fs.readdirSync(source);
  } else {
    files = [source];
  }

  for (let file of files) {
    const filename = file.indexOf('/') === 0 ? file : Path.join(source, file);
    if (Utils.isOkFile(filename) && Path.extname(filename) === '.sol') {
      solFiles.push(filename);
    }
    if (Utils.isOkDirectory(filename)) {
      readSolidityFilesPath(filename, solFiles);
    }
  };
}

function parseSolFile(solFile, solObjects) {
  const contents = Fs.readFileSync(solFile, "utf8");

  let ast;
  try {
    ast = Solparser.parse(contents);
  } catch (e) {
    console.error('Parse error %s %s', e.message, e.stack);
    process.exit(1);
  }

  if (!ast.type === "Program" || !Array.isArray(ast.body) || ast.body.length <= 0) {
    console.log(ast);
    return;
  }

  ast.body.forEach(item => {
    switch (item.type) {
      // import
      case "ImportStatement":
        console.log("[ %j ]", item.from);
        if (item.from.indexOf('/') === 0) {
          // load from absolute path
        } else if (item.from.indexOf('.') === 0) {
          // load from related path
        } else {
          // load from node_modules
        }
      break;

      // contract
      case "ContractStatement":
        // contract is xxx
        contracts[item.name] = {is: item.is.map(item => item.name)};

        for (let contractBody of item.body) {
          if (typeof Utils.ContractBodyType[contractBody.type] === 'function') {
            const contractItem = Utils.ContractBodyType[contractBody.type](contractBody) + '\\l';
            contracts[item.name][contractBody.type] = contracts[item.name][contractBody.type] ? contracts[item.name][contractBody.type] + contractItem : contractItem;
          } else {
            console.log(contractBody);
          }
        }
      break;

      default:
      break;
    }
  });
}

