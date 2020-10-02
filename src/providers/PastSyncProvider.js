const BaseProvider = require('./BaseProvider.js');

const util = require('./../util.js');

class PastSyncProvider extends BaseProvider {
  static getContractPrefix() {
    return 'PastSync';
  }

  onDataUpdate(value) {
    super.onDataUpdate(value);
    util.wrapTx(
      this.name,
      'set',
      this.receipts,
      this.contract.methods.set(value).send({
        nonce: util.getNonce(this.account),
        ...util.defaultOptions
      })
    );
  }
}

module.exports = PastSyncProvider;
