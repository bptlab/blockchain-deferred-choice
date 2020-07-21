const fs = require('fs-extra');
const solc = require('solc');
const Web3 = require('web3');

const SOURCES = [
  'Interfaces.sol',
  'choices/AbstractChoice.sol',
  'choices/FutureAsyncChoice.sol',
  'choices/PastAsyncChoice.sol',
  'choices/PastSyncChoice.sol',
  'choices/PresentAsyncChoice.sol',
  'choices/PresentSyncChoice.sol',
  'oracles/FutureAsyncOracle.sol',
  'oracles/PastAsyncOracle.sol',
  'oracles/PastSyncOracle.sol',
  'oracles/PresentAsyncOracle.sol',
  'oracles/PresentSyncOracle.sol'
];

const KEYS = {
  Consumer: '9756b00ca92badafd4d9ce3b6f02134b4de13cbb9dceaf9db61eda3724bd3a30',
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
      accounts[key] = web3.eth.accounts.wallet.add(KEYS[key]).address;
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
    console.log(compilerOut);
    specs = Object.assign({}, ...Object.values(compilerOut.contracts));
    console.log('Successfully compiled', Object.keys(specs).length, 'contracts/interfaces');
  }

  // Return the contract specification specified
  return specs[spec];
}
