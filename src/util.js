const fs = require('fs-extra');
const solc = require('solc');
const Web3 = require('web3');
const glob = require("glob");

const KEYS = require('./keys/private.json');

const PastAsyncProvider = require('./providers/PastAsyncProvider.js');
const PastAsyncCondProvider = require('./providers/PastAsyncCondProvider.js');
const PastSyncProvider = require('./providers/PastSyncProvider.js');
const PastSyncCondProvider = require('./providers/PastSyncCondProvider.js');
const PresentAsyncProvider = require('./providers/PresentAsyncProvider.js');
const PresentAsyncCondProvider = require('./providers/PresentAsyncCondProvider.js');
const PresentSyncProvider = require('./providers/PresentSyncProvider.js');
const PresentSyncCondProvider = require('./providers/PresentSyncCondProvider.js');
const FutureAsyncProvider = require('./providers/FutureAsyncProvider.js');
const FutureAsyncCondProvider = require('./providers/FutureAsyncCondProvider.js');

// Connect to blockchain
const web3 = new Web3(new Web3.providers.WebsocketProvider(
  //'wss://ropsten.infura.io/ws/v3/ac8b7480996843d18ee89a61c6d0d673' // Infura
  //'ws://localhost:8545' // ganache
  'ws://localhost:8546' // geth
));
web3.eth.transactionBlockTimeout = 1000;

let specs;
let accounts;
let nonces;

exports.web3 = web3;

// Top timestamp used in contracts, equal to type(uint256).max
exports.TOP_TIMESTAMP = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

exports.init = async function() {
  // Setup a very simple precompiler which removes DEBUG instructions
  const PRE_OPTIONS = {
    DEBUG: false
  };
  const prePattern = new RegExp('// #ifdef ([A-Z]+)\\s*$([\\S\\s]*?)// #endif\\s*$', 'ugm');
  const preReplace = (_, p1, p2) => PRE_OPTIONS[p1] ? p2 : '';

  // Compile contracts
  const files = glob.sync('./solidity/**/*.sol');
  const sources = Object.assign({}, ...files.map(file => {
    file = file.replace('./solidity/', '');
    let content = fs
      .readFileSync('./solidity/' + file, { encoding: 'utf8' })
      .replace(prePattern, preReplace);
    return {
      [file]: { content }
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
  console.log(compilerOut);
  specs = Object.assign({}, ...Object.values(compilerOut.contracts));
  console.log('Successfully compiled', Object.keys(specs).length, 'contracts/interfaces');

  // Initiate accounts
  accounts = KEYS.map(key => {
    return web3.eth.accounts.wallet.add(key).address;
  });
  console.log('Registered', KEYS.length, 'accounts');

  // Initiate nonces
  nonces = await Promise.all(accounts.map(
    address => web3.eth.getTransactionCount(address)
  ));
}

exports.defaultOptions = {
  gas: 5000000,
  gasPrice: '100000000000' // 100 gwei
}

exports.expressionType = {
  'Expression': {
    'operator': 'uint8',
    'value': 'uint256'
  }
};

exports.enums = {
  EventDefinition: {
    TIMER: 0,
    CONDITIONAL: 1,
    EXPLICIT: 2
  },
  Operator: {
    GREATER: 0,
    GREATER_EQUAL: 1,
    EQUAL: 2,
    LESS_EQUAL: 3,
    LESS: 4
  }
};

let pending = 0;
exports.wrapTx = function(name, label, receipts, tx) {
  pending++;
  return tx.on('transactionHash', hash => {
    console.log(name, label, '|', 'HASH', hash);
  }).on('receipt', receipt => {
    pending--;
    receipts.push(receipt);
    console.log(name, label, '|', 'RECEIPT, BLOCK#', receipt.blockNumber);
  }).on('error', error => {
    pending--;
    if (error.receipt) {
      receipts.push(error.receipt);
    }
    console.log(name, label, '|', 'FAILED', error.message.split('\n', 1)[0]);
  });
}

exports.waitForPending = async function() {
  while (pending > 0) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

exports.checkExpression = function(expression, value) {
  const operator = expression.operator;
  if (operator == this.enums.Operator.GREATER) {
    return value > expression.value;
  } else if (operator == this.enums.Operator.GREATER_EQUAL) {
    return value >= expression.value;
  } else if (operator == this.enums.Operator.EQUAL) {
    return value == expression.value;
  } else if (operator == this.enums.Operator.LESS_EQUAL) {
    return value <= expression.value;
  } else if (operator == this.enums.Operator.LESS) {
    return value < expression.value;
  }
}

exports.getAccount = function(index) {
  return accounts[index];
}

exports.getNonce = function(index) {
  return nonces[index]++;
}

exports.getProviders = () => [
  PresentSyncProvider,
  PresentSyncCondProvider,
  PresentAsyncProvider,
  PresentAsyncCondProvider,
  FutureAsyncCondProvider,
  FutureAsyncProvider,
  PastAsyncProvider,
  PastAsyncCondProvider,
  PastSyncProvider,
  PastSyncCondProvider
]

exports.getSpec = function(spec) {
  return specs[spec];
}
