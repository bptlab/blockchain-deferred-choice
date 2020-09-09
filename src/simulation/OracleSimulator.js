const Simulator = require('./Simulator.js');

const util = require('../util.js');

class OracleSimulator extends Simulator {
  contract;
  provider;
  config;
  receipts = [];
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
    return this.receipts.concat(this.provider.receipts).reduce((gas, receipt) => gas + receipt.gasUsed, 0);
  }

  getTxCount() {
    return this.receipts.length + this.provider.receipts.length;
  }

  async deploy() {
    // Create contract
    await util.wrapTx(
      this.config.name,
      'deploy',
      this.contract.deploy().send({
        nonce: util.getNonce(this.contract.defaultAccount)
      }).on('receipt', receipt => {
        this.receipts.push(receipt);
        this.contract.options.address = receipt.contractAddress;
      })
    );

    // Wrap contract in provider
    this.provider = new this.ProviderClazz(this.config.name, this.contract);

    return this.contract.options.address;
  }

  onAction(index, context) {
    super.onAction(index, context);
    this.provider.onDataUpdate(context.value);
  }
}

module.exports = OracleSimulator;
