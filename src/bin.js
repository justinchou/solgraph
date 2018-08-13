const com          = require('commander');
const pkg          = require('../package.json');
const solgraph     = require('./index.js');
const { readFile } = require('fs');

const extendedHelp = `

${pkg.description}

Example:
$ cat MyContract.sol | solgraph > MyContract.doti

`;

const program = com
  .version(pkg.version)
  .arguments('<file>')
  .usage(extendedHelp)
  .parse(process.argv)

const input = program.args[0]
  // filename from command line arguments
  ? new Promise((resolve, reject) => {
    readFile(program.args[0], 'utf-8', (err, data) => {
      if(err) { return reject(err); }

      resolve(data);
    })
  })
  // stdin
  : require('get-stdin-promise');

input.then(source => {
  console.log(solgraph(source))
});
