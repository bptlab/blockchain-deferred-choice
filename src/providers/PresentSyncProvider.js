const BaseProvider = require('./BaseProvider.js');

const util = require('./../util.js');

class PresentSyncProvider extends BaseProvider {
  static getContractName() {
    return 'PresentSyncOracle';
  }

  static getTemplateOptions() {
    return {
      PRESENT: true,
      SYNC: true
    };
  }

  onValueChange(value) {
    super.onValueChange(value);
    this.contract.methods.set(value).send({
      ...util.defaultOptions
    }).on('transactionHash', hash => {
      console.log('O[', this.name, ']', 'Change tx', '|', 'HASH', hash);
    }).on('receipt', receipt => {
      console.log('O[', this.name, ']', 'Change tx', '|', 'RECEIPT');
      this.gasUsed += receipt.gasUsed;
    }).on('error', console.error);
  }
}

module.exports = PresentSyncProvider;
