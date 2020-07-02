const Web3 = require('web3');
const vorpal = require('vorpal')();

const util = require('./util.js');

// Connect to blockchain and prepare environment
const web3 = new Web3(new Web3.providers.WebsocketProvider(
  //'wss://ropsten.infura.io/ws/v3/ac8b7480996843d18ee89a61c6d0d673'
  'ws://localhost:8545'
));
const account = util.registerPrivateKey(web3, './keys/oracles.ppk');
const specs = util.compileContracts('Interfaces.sol', 'Oracles.sol');

class Oracle {
  constructor(name, log) {
    this.name = name;
    this.log = log;

    const spec = this.getSpec();
    this.contract = new web3.eth.Contract(spec.abi, undefined, {
      from: account,
      ...util.defaultOptions,
      data: spec.evm.bytecode.object
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

  replay() {
    this.replayTime = 0;
    this.replayStep = 0;
    this.replayPrev = Date.now();

    return new Promise(resolve => {
      const step = () => {
        this.onValueChange(this.log[this.replayStep].value);
        this.replayStep++;
        if (this.replayStep < this.log.length) {
          const oldTimer = this.replayPrev;
          const newTimer = Date.now();
          this.replayTime += newTimer - oldTimer;
          setTimeout(step.bind(this), this.log[this.replayStep].at - this.replayTime);
          this.replayPrev = newTimer;
        } else {
          return resolve();
        }
      }
      step.call(this);
    });
  }

  getSpec() {
    return undefined;
  }

  onValueChange(value) {
    console.log(this.name, 'VALUE_CHANGE', value);
  }

  onContractEvent(event) {
    console.log(this.name, 'EVENT', event.event);
  }
}

class AsyncOracle extends Oracle {
  currentValue;

  onValueChange(value) {
    super.onValueChange(value);
    this.currentValue = value;
  }

  onContractEvent(event) {
    super.onContractEvent(event);
    if (event.event == 'Query') {
      this.onQuery(
        event.returnValues.sender,
        event.returnValues.correlation,
        event.returnValues.params
      );
    }
  }

  onQuery(sender, correlation, params) {
    console.log(this.name, 'QUERY', sender, correlation, params);
  }

  doCallback(consumerAddress, correlation, types, values) {
    const requester = new web3.eth.Contract(
      specs.OracleConsumer.abi,
      consumerAddress
    );
    requester.methods.oracleCallback(
      this.contract.options.address,
      correlation,
      web3.eth.abi.encodeParameters(types, values)
    ).send({
      from: account,
      ...util.defaultOptions
    }).on('transactionHash', hash => {
      console.log(this.name, 'REQUESTER HASH', hash);
    }).on('receipt', receipt => {
      console.log(this.name, 'REQUESTER RECEIPT');
    }).on('error', console.error);
  }
}

class RequestResponseOracle extends AsyncOracle {
  getSpec() {
    return specs['RequestResponseOracle'];
  }

  onQuery(sender, correlation, params) {
    super.onQuery(sender, correlation, params);
    this.doCallback(sender, correlation, ['int256'], [this.currentValue]);
  }
}

class PublishSubscribeOracle extends AsyncOracle {
  subscribers = [];

  getSpec() {
    return specs['PublishSubscribeOracle'];
  }

  onValueChange(value) {
    super.onValueChange(value);
    this.subscribers.forEach(sub => {
      this.doCallback(sub.sender, sub.correlation, ['int256'], [this.currentValue]);
    });
  }

  onQuery(sender, correlation, params) {
    super.onQuery(sender, correlation, params);
    this.subscribers.push({
      sender, correlation, params
    });
    this.doCallback(sender, correlation, ['int256'], [this.currentValue]);
  }
}

class StorageOracle extends Oracle {
  getSpec() {
    return specs['StorageOracle'];
  }

  onValueChange(value) {
    super.onValueChange(value);
    this.contract.methods.set(value).send({
      from: account,
      ...util.defaultOptions
    }).on('transactionHash', hash => {
      console.log(this.name, 'UPDATE HASH', hash);
    }).on('receipt', receipt => {
      console.log(this.name, 'UPDATE RECEIPT');
    }).on('error', console.error);
  }
}

let someOracle;

vorpal
  .command('deploy', 'Deploy a new set of oracles.')
  .action(() => {
    someOracle = new PublishSubscribeOracle(
      'TestOracle',
      [
        { at:    0, value:  5 },
        { at: 1000, value:  8 },
        { at: 2000, value: 10 },
        { at: 4000, value:  5 },
        { at: 5000, value:  4 }
      ]
    );
    return someOracle.deploy();
  });

vorpal
  .command('replay', 'Start replay of last deployed oracles.')
  .action(() => {
    return someOracle.replay();
  });

vorpal
  .delimiter('oracles$')
  .show();

// deploy an oracle
// async function deployAndTest() {
//   const someOracle = new RequestResponseOracle(
//     'TestOracle',
//     [
//       { at:    0, value:  5 },
//       { at: 1000, value:  8 },
//       { at: 2000, value: 10 },
//       { at: 4000, value:  5 },
//       { at: 5000, value:  4 }
//     ]
//   );
//   await someOracle.deploy();
//   someOracle.startReplay();
// }

// deployAndTest();



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
