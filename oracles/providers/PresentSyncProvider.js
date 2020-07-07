const BaseProvider = require('./BaseProvider.js');

class PresentSyncProvider extends BaseProvider {
  getSpec(specs) {
    return specs['PresentSyncOracle'];
  }

  onValueChange(value) {
    super.onValueChange(value);
    this.contract.methods.set(value).send({
      from: this.account,
      ...util.defaultOptions
    }).on('transactionHash', hash => {
      console.log(this.name, 'UPDATE HASH', hash);
    }).on('receipt', receipt => {
      console.log(this.name, 'UPDATE RECEIPT');
    }).on('error', console.error);
  }
}

module.exports = PresentSyncProvider;
