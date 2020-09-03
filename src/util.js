const fs = require('fs-extra');
const solc = require('solc');
const Web3 = require('web3');
const glob = require("glob");

const KEYS = {
  Consumer: '9756b00ca92badafd4d9ce3b6f02134b4de13cbb9dceaf9db61eda3724bd3a30',
  Consumer2: 'f9a4f587def617e4d943fe5ce1b1f0b4a86270ce7e8baaeb4087f3ce10f28684',
  Oracle: '68ea7c2f6d68a6cecb02009e0767e11546d276abb607c3a910b4d07ef4d3a2a5',
  Oracle2: '22ceb0fc8deaa76b6c96be6cd7b63c3154bc67f2b4332d2895aa123e2988fb76'
};

// Connect to blockchain
const web3 = new Web3(new Web3.providers.WebsocketProvider(
  //'wss://ropsten.infura.io/ws/v3/ac8b7480996843d18ee89a61c6d0d673'
  'ws://localhost:8545'
));

let specs;
let accounts;
let nonces;

exports.web3 = web3;

// Top timestamp used in contracts, equal to type(uint256).max
exports.TOP_TIMESTAMP = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

exports.init = async function() {
  // Setup a very simple precompiler which removes DEBUG instructions
  const PRE_OPTIONS = {
    DEBUG: true
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
  accounts = {};
  Object.keys(KEYS).forEach(key => {
    accounts[key] = web3.eth.accounts.wallet.add(KEYS[key]).address;
  });

  // Initiate nonces
  nonces = {};
  await Promise.all(Object.values(accounts).map(
    address => web3.eth.getTransactionCount(address).then(nonce => {
      nonces[address] = nonce;
    })
  ));
}

exports.defaultOptions = {
  gas: 5000000,
  gasPrice: '20000000000' // 20 gwei
}

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

exports.wrapTx = function(name, info, tx) {
  return tx.on('transactionHash', hash => {
    console.log(name, info, '|', 'HASH', hash);
  }).on('receipt', receipt => {
    console.log(name, info, '|', 'RECEIPT');
  }).on('error', error => {
    console.log(name, info, '|', 'FAILED', error);
  });
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

exports.getAccount = function(name) {
  return accounts[name];
}

exports.getNonce = function(account) {
  return nonces[account]++;
}

exports.getSpec = function(spec) {
  return specs[spec];
}
