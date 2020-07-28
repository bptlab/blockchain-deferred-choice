const Replayer = require('./Replayer.js');

const util = require('../util.js');

class OracleInstance extends Replayer {
  contract;
  provider;
  config;
  gasUsed = 0;
  ProviderClazz;

  constructor(config, ProviderClazz) {
    super(config.timeline);
    this.config = config;
    this.ProviderClazz = ProviderClazz;

    const spec = util.getSpec(ProviderClazz.getContractPrefix() + 'Oracle');
    this.contract = new util.web3.eth.Contract(spec.abi, undefined, {
      from: util.getAccount(this.config.account),
      ...util.defaultOptions,
      data: spec.evm.bytecode.object
    })
    this.contract.defaultAccount = util.getAccount(this.config.account);
  }

  getGasUsed() {
    return this.gasUsed + this.provider.getGasUsed();
  }

  async deploy() {
    // Create contract
    await util.wrapTx(
      this.config.name,
      'deploy',
      this.contract.deploy().send({
        nonce: util.getNonce(this.contract.defaultAccount)
      }).on('receipt', receipt => {
        this.gasUsed += receipt.gasUsed;
        this.contract.options.address = receipt.contractAddress;
      })
    );

    // Wrap contract in provider
    this.provider = new this.ProviderClazz(this.config.name, this.contract);

    return this.contract.options.address;
  }

  onReplayStep(index, context) {
    super.onReplayStep(index, context);
    this.provider.onValueChange(context.value);
  }
}

module.exports = OracleInstance;
