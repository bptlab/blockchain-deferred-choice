const Replayer = require('./Replayer.js');

const util = require('../util.js');

class OracleInstance extends Replayer {
  config;
  contract;
  provider;

  constructor(config) {
    super(config.timeline);
    this.config = config;
  }

  getAddress() {
    return this.contract.options.address;
  }

  async deploy() {
    // Create contract
    const spec = this.config.clazz.getSpec();
    this.contract = await new util.web3.eth.Contract(spec.abi, undefined, {
      from: this.config.account,
      ...util.defaultOptions,
      data: spec.evm.bytecode.object
    }).deploy().send().on('transactionHash', hash => {
      console.log(this.config.name, 'HASH', hash);
    }).on('receipt', receipt => {
      console.log(this.config.name, 'RECEIPT', receipt.contractAddress);
    }).on('error', error => {
      console.error(this.config.name, 'ERROR', error);
    });
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
