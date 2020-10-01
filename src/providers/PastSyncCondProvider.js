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
      this.contract.methods.set(value).send({
        nonce: util.getNonce(this.account),
        ...util.defaultOptions
      }).on('receipt', receipt => {
        this.receipts.push(receipt);
      })
    );
  }
}

module.exports = PastSyncCondProvider;
