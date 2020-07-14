const Replayer = require('./Replayer.js');

const util = require('../util.js');

class OracleInstance extends Replayer {
  config;
  contract;
  provider;
  gasUsed = 0;

  constructor(config) {
    super(config.timeline);
    this.config = config;
  }

  getAddress() {
    return this.contract.options.address;
  }

  getGasUsed() {
    return this.gasUsed + this.provider.getGasUsed();
  }

  async deploy() {
    // Create contract
    const spec = this.config.clazz.getSpec();
    this.contract = await new util.web3.eth.Contract(spec.abi, undefined, {
      from: this.config.account,
      ...util.defaultOptions,
      data: spec.evm.bytecode.object
    }).deploy().send().on('transactionHash', hash => {
      console.log('O[', this.config.name, ']', 'Deployment', '|', 'HASH', hash);
    }).on('receipt', receipt => {
      console.log('O[', this.config.name, ']', 'Deployment', '|', 'RECEIPT', receipt.contractAddress);
      this.gasUsed += receipt.gasUsed;
    }).on('error', console.error);
    this.contract.defaultAccount = this.config.account;

    // Wrap contract in provider
    this.provider = new this.config.clazz(this.config.name, this.contract);
  }

  onReplayStep(index, context) {
    super.onReplayStep(index, context);
    this.provider.onValueChange(context.value);
  }
}

module.exports = OracleInstance;
