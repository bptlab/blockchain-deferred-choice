const fs = require('fs-extra');
const solc = require('solc');
const Web3 = require('web3');
const glob = require("glob");

// Load the private keys of the pre-funded Ethereum accounts
const KEYS = require('./keys/private.json');

// Load all providers
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

// Connect to local geth node
const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8546'));
web3.eth.transactionBlockTimeout = 1000;
exports.web3 = web3;

// Shared variables
let specs;
let accounts;
let nonces;
let pending = 0;

// Top timestamp used in contracts, equal to type(uint256).max
exports.TOP_TIMESTAMP = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

// Default options of all blockchain transactions
exports.defaultOptions = {
  gas: 5000000,
  gasPrice: '100000000000' // 100 gwei
}

// Solidity expression struct
exports.expressionType = {
  'Expression': {
    'operator': 'uint8',
    'value': 'uint256'
  }
};

// Solidity enumerations
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

/**
 * Initialize the blockchain connection and smart contracts.
 */
exports.init = async function() {
  // Setup a very simple precompiler which removes DEBUG instructions
  const preOptions = { DEBUG: false };
  const prePattern = new RegExp('// #ifdef ([A-Z]+)\\s*$([\\S\\s]*?)// #endif\\s*$', 'ugm');
  const preReplace = (_, p1, p2) => preOptions[p1] ? p2 : '';

  // Load and precompile contracts
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

  // Compile contracts
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

/**
 * This function wraps around an Ethereum transaction and manages console output
 * and receipt collection.
 *
 * @param {string} name Contract name to add to debug output
 * @param {string} label Label to add to debug output
 * @param {Array} receipts Array to add receipt to
 * @param {Object} tx Transaction object
 */
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

/**
 * Busy-wait for all pending transactions to finish.
 */
exports.waitForPending = async function() {
  while (pending > 0) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

/**
 * @param {Expression} expression Expression to check
 * @param {number} value Value to check against
 */
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
