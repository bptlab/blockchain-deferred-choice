const BaseProvider = require('./BaseProvider.js');

const util = require('./../util.js');

class PastSyncCondProvider extends BaseProvider {
  static getContractPrefix() {
    return 'PastSyncCond';
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

module.exports = PastSyncCondProvider;
