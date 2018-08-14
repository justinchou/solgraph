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
    .option('-t, --target  [value]', 'target dot file name')
    .action(function () {
        option = Utils.parseOption(arguments);
        params = Utils.parseParams(arguments);

        const source = Path.join(rootPath, params.source);
        const target = Path.join(rootPath, params.target || '.');

        if (!Utils.isOkDirectory(source)) throw new Error('invalid input directory');
        Utils.mkOutputDirectory(target);

        const files = [];
        readSolidityFilesPath(source, files);

        // console.log("Files %j", files);
        for (solFile of files) {
          console.log("Sol File %s", solFile);
          parseSolFile(solFile);
        }
    });

Program.parse(process.argv);

function readSolidityFilesPath(source, solFiles) {
  const files = Fs.readdirSync(source);
  for (file of files) {
    const filename = Path.join(source, file);
    if (Utils.isOkFile(filename) && Path.extname(filename) === '.sol') {
      solFiles.push(filename);
    }
    if (Utils.isOkDirectory(filename)) {
      readSolidityFilesPath(filename, solFiles);
    }
  };
}

function parseSolFile(solFile) {
  const contents = Fs.readFileSync(solFile, "utf8");

  let ast;
  try {
    ast = Solparser.parse(contents);
  } catch (e) {
    console.error('Parse error');
    console.error(e);
    process.exit(1);
  }

  if (ast.type === "Program") {
    console.log(ast.body);
  }
}

