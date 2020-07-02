const Web3 = require('web3');
const fs = require('fs-extra');
const solc = require('solc');

// blockchain connection
const web3 = new Web3(new Web3.providers.WebsocketProvider(
  //'wss://ropsten.infura.io/ws/v3/ac8b7480996843d18ee89a61c6d0d673'
  'ws://localhost:8545'
));

// key and account management
const deferredKey = fs.readFileSync('./keys/deferred.ppk', { encoding: 'utf8' });
web3.eth.accounts.wallet.add(deferredKey);
const deferredAdd = web3.eth.accounts.wallet[0].address;

// contract compilation
const codeInterfaces = fs.readFileSync('./solidity/Interfaces.sol', { encoding: 'utf8' });
const codeDeferred = fs.readFileSync('./solidity/DeferredChoice.sol', { encoding: 'utf8' });
const compilerInput = {
  language: 'Solidity',
  sources: {
    'Interfaces.sol': {
      content: codeInterfaces
    },
    'DeferredChoice.sol': {
      content: codeDeferred
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
const specs = {
  Oracle: compiled.contracts['Interfaces.sol'].Oracle,
  OracleConsumer: compiled.contracts['Interfaces.sol'].OracleConsumer,
  DeferredChoice: compiled.contracts['Interfaces.sol'].DeferredChoice,
  BaseDeferredChoice: compiled.contracts['DeferredChoice.sol'].BaseDeferredChoice,
}

// deploy an oracle
async function deployAndTest() {
  const contract = new web3.eth.Contract(specs.BaseDeferredChoice.abi, undefined, {
    from: deferredAdd,
    gas: 5000000,
    gasPrice: web3.utils.toWei('20', 'gwei'),
    data: specs.BaseDeferredChoice.evm.bytecode.object
  });

  const instance = await contract.deploy({
    arguments: [[
      [0, 0, "0xedE70852D4BfF71bAfa519C21F4d9C05fC863874", [0, 1337]]
    ]]
  }).send().on('transactionHash', hash => {
    console.log(this.name, 'HASH', hash);
  }).on('receipt', receipt => {
    console.log(this.name, 'RECEIPT', receipt.contractAddress);
  }).on('error', error => {
    console.error(this.name, 'ERROR', error);
  })

  instance.events.allEvents({
    fromBlock: 'latest'
  }).on('data', data => {
    console.log(this.name, 'EVENT', data.event, data.returnValues);
  }).on('error', error => {
    console.error(this.name, 'ERROR', error);
  });
}

deployAndTest();
