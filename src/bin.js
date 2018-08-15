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

        for (solFile of solFiles) {
          console.log("Sol File %s", solFile);
          parseSolFile(solFile, solObjects);
        }
        console.log(contracts);
    });

Program.parse(process.argv);

function readSolidityFilesPath(source, solFiles) {
  let files;
  if (Utils.isOkDirectory(source)) {
    files = Fs.readdirSync(source);
  } else {
    files = [source];
  }

  for (file of files) {
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
        console.log("[ %j ]", item);
      break;
      // contract
      case "ContractStatement":
        // console.log("[ %j ]", item.body);

        // contract is xxx
        contracts[item.name] = {is: item.is.map(item => item.name)};

        // console.log(item);
        for (let contractBody of item.body) {
          // variable
          if (contractBody.type === "StateVariableDeclaration") {
            let variable = {
              name        : contractBody.name, 
              type        : contractBody.literal.literal, 
              visibility  : contractBody.visibility, 
              is_constant : contractBody.is_constant, 
              value       : contractBody.value,
            };
        
            console.log(variable);
          } else
          // function
          if (contractBody.type === "FunctionDeclaration") {
            let func = {
              name         : contractBody.name, 
              params       : contractBody.params, 
              modifiers    : contractBody.modifers, 
              // body         : contractBody.body,
              returnParams : contractBody.returnParams, 
              is_abstract  : contractBody.is_abstract, 
            };
        
            console.log(func);
          } else
          // event
          if (contractBody.type === "EventDeclaration") {
          } else
          // modifer
          if (contractBody.type === "ModifierDeclaration") {
          } else
          // struct
          if (contractBody.type === "StructDeclaration") {
          } else
          // using
          if (contractBody.type === "UsingStatement") {
          } else
          console.log(contractBody);

        }
      break;

      default:
      break;
    }
  });
}

