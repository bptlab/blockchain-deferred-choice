const BaseProvider = require('./BaseProvider.js');

const util = require('./../util.js');

class PresentSyncProvider extends BaseProvider {
  static getSpec() {
    return util.getSpec('PresentSyncOracle');
  }

  onValueChange(value) {
    super.onValueChange(value);
    this.contract.methods.set(value).send({
      ...util.defaultOptions
    }).on('transactionHash', hash => {
      console.log(this.name, 'UPDATE HASH', hash);
    }).on('receipt', receipt => {
      console.log(this.name, 'UPDATE RECEIPT');
    }).on('error', console.error);
  }
}

module.exports = PresentSyncProvider;
