const fs = require('fs-extra');
const solc = require('solc');

exports.defaultOptions = {
  gas: 5000000,
  gasPrice: '20000000000' // 20 gwei
}

exports.registerPrivateKey = function(web3, path) {
  const key = fs.readFileSync(path, { encoding: 'utf8' });
  return web3.eth.accounts.wallet.add(key).address;
}

exports.compileContracts = function(...files) {
  const sources = Object.assign({}, ...files.map(file => {
    return {
      [file]: {
        content: fs.readFileSync('./solidity/' + file, { encoding: 'utf8' })
      }
    };
  }));

  const compilerIn = {
    language: 'Solidity',
    sources,
    settings: {
      outputSelection: {
        '*': {
          '*': [
            'metadata', 'abi', 'evm.bytecode'
          ],
          '': []
        }
      }
    }
  };
  const compilerOut = JSON.parse(solc.compile(JSON.stringify(compilerIn)));

  return Object.assign({}, ...Object.values(compilerOut.contracts));
}
