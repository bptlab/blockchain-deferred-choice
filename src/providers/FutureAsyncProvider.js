const BaseProvider = require('./BaseProvider.js');

class FutureAsyncProvider extends BaseProvider {
  subscribers = [];
  currentValue = 0;

  static getContractPrefix() {
    return 'FutureAsync';
  }

  doCallback(subscriber) {
    this.sendConsumer(
      subscriber.sender,
      subscriber.correlation,
      'uint256',
      this.currentValue
    );
  }

  onValueChange(value) {
    super.onValueChange(value);
    this.currentValue = value;
    this.subscribers.forEach(sub => {
      this.doCallback(sub);
    });
  }

  onContractEvent(event) {
    super.onContractEvent(event);
    if (event.event = 'Query') {
      const sub = event.returnValues;
      this.subscribers.push(sub);
      this.doCallback(sub);
    }
  }
}

module.exports = FutureAsyncProvider;
