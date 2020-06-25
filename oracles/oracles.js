const Web3 = require('web3');
const fs = require('fs-extra');
const solc = require('solc');

// blockchain connection
const web3 = new Web3(new Web3.providers.WebsocketProvider(
  'wss://ropsten.infura.io/ws/v3/ac8b7480996843d18ee89a61c6d0d673'
));

// key and account management
const deferredKey = fs.readFileSync('./keys/deferred.ppk', { encoding: 'utf8' });
const oraclesKey = fs.readFileSync('./keys/oracles.ppk', { encoding: 'utf8' });
web3.eth.accounts.wallet.add(deferredKey);
web3.eth.accounts.wallet.add(oraclesKey);
const deferredAdd = web3.eth.accounts.wallet[0].address;
const oraclesAdd = web3.eth.accounts.wallet[1].address;

// contract compilation
const codeInterfaces = fs.readFileSync('./solidity/Interfaces.sol', { encoding: 'utf8' });
const codeOracles = fs.readFileSync('./solidity/Oracles.sol', { encoding: 'utf8' });
const compilerInput = {
  language: 'Solidity',
  sources: {
    'Interfaces.sol': {
      content: codeInterfaces
    },
    'Oracles.sol': {
      content: codeOracles
    }
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['*']
      }
    }
  }
};
const compiled = JSON.parse(solc.compile(JSON.stringify(compilerInput)));
requestCompiled = compiled.contracts['Oracles.sol'].RequestResponseOracle;

// // deploy a request oracle
const requestContract = new web3.eth.Contract(requestCompiled.abi);
// requestContract.deploy({
//   data: requestCompiled.evm.bytecode.object
// }).send({
//   from: oraclesAdd,
//   gas: 200000,
//   gasPrice: web3.utils.toWei('1', 'gwei')
// }).on('transactionHash', (hash) => {
//   console.log('Hash', hash);
// }).on('receipt', (receipt) => {
//   console.log('Receipt', receipt);
// }).on('error', console.error);
// // }).estimateGas((err, gas) => {
// //   console.log(gas);
// // });

const deployed = new web3.eth.Contract(
  requestCompiled.abi,
  '0x8B53aA36B046bcA716C3Df4fDE59d57C7F90e5E0'
);

deployed.events.Request({
  fromBlock: 0
}).on('data', (data) => {
  console.log('REQUEST', data);
}).on('error', console.error);

deployed.methods.getValue(
  42
).send({
  from: deferredAdd,
  gas: 200000,
  gasPrice: web3.utils.toWei('1', 'gwei')
}).on('transactionHash', (hash) => {
  console.log('Hash', hash);
}).on('receipt', (receipt) => {
  console.log('Receipt', receipt);
}).on('error', console.error);

// web3.eth.sendTransaction({
//   from: oraclesAdd,
//   value: web3.utils.toWei('1', 'ether'),
//   gas: 21000
// }).on('transactionHash', (hash) => {
//   console.log('Hash', hash);
// }).on('receipt', (receipt) => {
//   console.log('Receipt', receipt);
// }).on('error', console.error);

// web3.eth.getBalance("0xCfd7D177988076F99759c7814BC7f2603036C563", function(err, result) {
//   if (err) {
//     console.log(err)
//   } else {
//     console.log(web3.utils.fromWei(result, "ether") + " ETH")
//   }
// });

// web3.eth.sendTransaction({
//   from: deferredAdd,
//   to: oraclesAdd,
//   value: web3.utils.toWei('1', 'ether'),
//   gas: 21000
// }).on('transactionHash', (hash) => {
//   console.log('Hash', hash);
// }).on('receipt', (receipt) => {
//   console.log('Receipt', receipt);
// }).on('error', console.error);
