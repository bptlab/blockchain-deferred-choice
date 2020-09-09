const BaseAsyncProvider = require('./BaseAsyncProvider.js');

class PresentAsyncProvider extends BaseAsyncProvider {
  currentValue = 0;

  static getContractPrefix() {
    return 'PresentAsync';
  }

  onValueChange(value) {
    this.currentValue = value;
  }

  onQuery(sender, correlation) {
    this.sendConsumer(
      sender,
      correlation,
      'uint256',
      this.currentValue
    );
  }
}

module.exports = PresentAsyncProvider;
