const util = require('../util.js');

class OracleInstance {
  config;
  contract;
  provider;

  constructor(config) {
    this.config = config;
  }

  getAddress() {
    return this.contract.options.address;
  }

  async deploy() {
    // Create provider
    this.provider = new this.config.clazz(this.config.name, this.config.account);

    // Create contract
    const spec = this.provider.getSpec();
    this.contract = await new util.web3.eth.Contract(spec.abi, undefined, {
      from: this.account,
      ...util.defaultOptions,
      data: spec.evm.bytecode.object
    }).deploy().send().on('transactionHash', hash => {
      console.log(this.config.name, 'HASH', hash);
    }).on('receipt', receipt => {
      console.log(this.config.name, 'RECEIPT', receipt.contractAddress);
    }).on('error', error => {
      console.error(this.config.name, 'ERROR', error);
    });
    this.provider.link(this.contract);
  }

  async replay() {
    this.replayTime = 0;
    this.replayStep = 0;
    this.replayPrev = Date.now();

    return new Promise(resolve => {
      const step = () => {
        this.provider.onValueChange(this.config.timeline[this.replayStep].value);
        this.replayStep++;
        if (this.replayStep < this.config.timeline.length) {
          const oldTimer = this.replayPrev;
          const newTimer = Date.now();
          this.replayTime += newTimer - oldTimer;
          setTimeout(step.bind(this), this.config.timeline[this.replayStep].at - this.replayTime);
          this.replayPrev = newTimer;
        } else {
          return resolve();
        }
      }
      step.call(this);
    });
  }
}

module.exports = OracleInstance;
