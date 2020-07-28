const BaseProvider = require('./BaseProvider.js');

const util = require('./../util.js');

class PastSyncProvider extends BaseProvider {
  static getContractPrefix() {
    return 'PastSync';
  }

  onValueChange(value) {
    super.onValueChange(value);
    util.wrapTx(
      this.name,
      'set',
      this.contract.methods.set(value).send({
        nonce: util.getNonce(this.contract.defaultAccount),
        ...util.defaultOptions
      }).on('receipt', receipt => {
        this.gasUsed += receipt.gasUsed;
      })
    );
  }
}

module.exports = PastSyncProvider;
