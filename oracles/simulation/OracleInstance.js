const Replayer = require('./Replayer.js');

const util = require('../util.js');

class OracleInstance extends Replayer {
  contract;
  provider;
  name;
  gasUsed = 0;
  ProviderClazz;

  constructor(config, ProviderClazz) {
    super(config.timeline);
    this.name = config.name;
    this.ProviderClazz = ProviderClazz;

    const spec = ProviderClazz.getSpec();
    this.contract = new util.web3.eth.Contract(spec.abi, undefined, {
      from: config.account,
      ...util.defaultOptions,
      data: spec.evm.bytecode.object
    })
    this.contract.defaultAccount = config.account;
  }

  getGasUsed() {
    return this.gasUsed + this.provider.getGasUsed();
  }

  async deploy() {
    // Create contract
    await this.contract.deploy().send(
    ).on('transactionHash', hash => {
      console.log('O[', this.name, ']', 'Deployment', '|', 'HASH', hash);
    }).on('receipt', receipt => {
      console.log('O[', this.name, ']', 'Deployment', '|', 'RECEIPT', receipt.contractAddress);
      this.gasUsed += receipt.gasUsed;
      this.contract.options.address = receipt.contractAddress;
    }).on('error', console.error);

    // Wrap contract in provider
    this.provider = new this.ProviderClazz(this.name, this.contract);

    return this.contract.options.address;
  }

  onReplayStep(index, context) {
    super.onReplayStep(index, context);
    this.provider.onValueChange(context.value);
  }
}

module.exports = OracleInstance;
