const fs = require('fs-extra');
const solc = require('solc');
const Web3 = require('web3');

const SOURCES = [
  'Interfaces.sol',
  'DeferredChoice.sol',
  'Oracles.sol'
];

const KEYS = {
  Consumer: 'deferred.ppk',
  Oracle: 'oracles.ppk'
};

// Connect to blockchain
const web3 = new Web3(new Web3.providers.WebsocketProvider(
  //'wss://ropsten.infura.io/ws/v3/ac8b7480996843d18ee89a61c6d0d673'
  'ws://localhost:8545'
));

let specs;
let accounts;

exports.web3 = web3;

exports.defaultOptions = {
  gas: 5000000,
  gasPrice: '20000000000' // 20 gwei
}

exports.enums = {
  EventState: {
    INACTIVE: 0,
    ACTIVE : 1,
    COMPLETED: 2,
    ABORTED: 3
  },
  EventDefinition: {
    TIMER_ABSOLUTE: 0,
    TIMER_RELATIVE: 1,
    CONDITIONAL: 2,
    EXPLICIT: 3
  },
  ChoiceState: {
    CREATED: 0,
    RUNNING: 1,
    FINISHED: 2
  },
  Operator: {
    GREATER: 0,
    GREATER_EQUAL: 1,
    EQUAL: 2,
    LESS_EQUAL: 3,
    LESS: 4
  }
};

exports.getAccount = function(name) {
  // Register accounts if not yet done
  if (!accounts) {
    accounts = {};
    Object.keys(KEYS).forEach(key => {
      const ppk = fs.readFileSync('./keys/' + KEYS[key], { encoding: 'utf8' });
      accounts[key] = web3.eth.accounts.wallet.add(ppk).address;
    })
  }

  // Return the desired account address
  return accounts[name];
}

exports.getSpec = function(spec) {
  // Compile contracts if this has not yet been done
  if (!specs) {
    const sources = Object.assign({}, ...SOURCES.map(file => {
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

    specs = Object.assign({}, ...Object.values(compilerOut.contracts));
  }

  // Return the contract specification specified
  return specs[spec];
}
