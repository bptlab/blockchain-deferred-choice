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
const specs = {
  Oracle: compiled.contracts['Interfaces.sol'].Oracle,
  RequestResponseOracle: compiled.contracts['Oracles.sol'].RequestResponseOracle,
  StorageOracle: compiled.contracts['Oracles.sol'].StorageOracle,
  OracleConsumer: compiled.contracts['Interfaces.sol'].OracleConsumer,
}

class Oracle {
  constructor(name, spec, log) {
    this.name = name;
    this.spec = spec;
    this.log = log;
    this.ready = false;

    this.contract = new web3.eth.Contract(this.spec.abi, undefined, {
      from: oraclesAdd,
      gas: 200000,
      gasPrice: web3.utils.toWei('20', 'gwei'),
      data: this.spec.evm.bytecode.object
    });
  }

  async deploy() {
    await this.contract.deploy().send().on('transactionHash', hash => {
      console.log(this.name, 'HASH', hash);
    }).on('receipt', receipt => {
      console.log(this.name, 'RECEIPT', receipt.contractAddress);
    }).on('error', error => {
      console.error(this.name, 'ERROR', error);
    }).then(instance => {
      this.setup(instance.options.address)
    });
  }

  setup(address) {
    this.contract.options.address = address;
    this.contract.events.allEvents({
      fromBlock: 'latest'
    }).on('data', data => {
      console.log(this.name, 'EVENT', data);
      this.onContractEvent(data);
    }).on('error', error => {
      console.error(this.name, 'ERROR', error);
    })
  }

  startReplay() {
    this.replayTime = 0;
    this.replayStep = 0;
    this.replayPrev = Date.now();
    this.stepReplay();
  }

  stepReplay() {
    this.onValueChange(this.log[this.replayStep].value);
    this.replayStep++;
    if (this.replayStep < this.log.length) {
      const oldTimer = this.replayPrev;
      const newTimer = Date.now();
      this.replayTime += newTimer - oldTimer;
      setTimeout(this.stepReplay.bind(this), this.log[this.replayStep].at - this.replayTime);
      this.replayPrev = newTimer;
    }
  }

  onValueChange(value) {
    console.log(this.name, 'VALUE_CHANGE', value);
  }

  onContractEvent(event) {
    console.log(this.name, 'EVENT', event.event);
  }
}

class RequestResponseOracle extends Oracle {
  currentValue;

  onValueChange(value) {
    super.onValueChange(value);
    this.currentValue = value;
  }

  onContractEvent(event) {
    super.onContractEvent(event);

    // call the receiver contract
    const requester = new web3.eth.Contract(
      specs.OracleConsumer.abi,
      event.returnValues.requester
    );
    requester.methods.oracleCallback(
      this.contract.options.address,
      event.returnValues.correlation,
      this.currentValue
    ).send({
      from: oraclesAdd,
      gas: 200000,
      gasPrice: web3.utils.toWei('20', 'gwei')
    }).on('transactionHash', hash => {
      console.log(this.name, 'REQUESTER HASH', hash);
    }).on('receipt', receipt => {
      console.log(this.name, 'REQUESTER RECEIPT');
    }).on('error', console.error);
  }
}

class StorageOracle extends Oracle {
  onValueChange(value) {
    super.onValueChange(value);
    this.contract.methods.setValue(value).send({
      from: oraclesAdd,
      gas: 200000,
      gasPrice: web3.utils.toWei('20', 'gwei')
    }).on('transactionHash', hash => {
      console.log(this.name, 'UPDATE HASH', hash);
    }).on('receipt', receipt => {
      console.log(this.name, 'UPDATE RECEIPT');
    }).on('error', console.error);
  }
}

// deploy an oracle
async function deployAndTest() {
  const someOracle = new StorageOracle(
    'TestOracle',
    specs.StorageOracle,
    [
      { at:    0, value:  5 },
      { at: 1000, value:  8 },
      { at: 2000, value: 10 },
      { at: 4000, value:  5 },
      { at: 5000, value:  4 }
    ]
  );
  await someOracle.deploy();
  someOracle.startReplay();
}

deployAndTest();



// deployed.methods.getValue(
//   42
// ).send({
//   from: deferredAdd,
//   gas: 200000,
//   gasPrice: web3.utils.toWei('1', 'gwei')
// }).on('transactionHash', (hash) => {
//   console.log('Hash', hash);
// }).on('receipt', (receipt) => {
//   console.log('Receipt', receipt);
// }).on('error', console.error);

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
