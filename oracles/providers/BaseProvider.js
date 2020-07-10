const util = require('./../util.js');

class BaseProvider {
  constructor(name, account, log) {
    this.name = name;
    this.account = account;
    this.log = log;

    const spec = this.getSpec();
    this.contract = new util.web3.eth.Contract(spec.abi, undefined, {
      from: this.account,
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

  getSpec(specs) {
    return undefined;
  }

  onValueChange(value) {
    console.log(this.name, 'VALUE_CHANGE', value);
  }

  onContractEvent(event) {
    console.log(this.name, 'EVENT', event.event);
  }
}

module.exports = BaseProvider;
