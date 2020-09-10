const BaseProvider = require('./BaseProvider.js');

const util = require('./../util.js');

class PresentSyncCondProvider extends BaseProvider {
  static getContractPrefix() {
    return 'PresentSyncCond';
  }

  onDataUpdate(value) {
    super.onDataUpdate(value);
    util.wrapTx(
      this.name,
      'set',
      this.contract.methods.set(value).send({
        nonce: util.getNonce(this.contract.defaultAccount),
        ...util.defaultOptions
      }).on('receipt', receipt => {
        this.receipts.push(receipt);
      })
    );
  }
}

module.exports = PresentSyncCondProvider;
