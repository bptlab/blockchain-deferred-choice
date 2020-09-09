const BaseProvider = require('./BaseProvider.js');

class PresentAsyncProvider extends BaseProvider {
  currentValue = 0;

  static getContractPrefix() {
    return 'PresentAsync';
  }

  onValueChange(value) {
    this.currentValue = value;
  }

  onContractEvent(event) {
    super.onContractEvent(event);
    if (event.event = 'Query') {
      this.sendConsumer(
        event.returnValues.sender,
        event.returnValues.correlation,
        'uint256',
        this.currentValue
      );
    }
  }
}

module.exports = PresentAsyncProvider;
