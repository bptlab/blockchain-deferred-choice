const BaseAsyncProvider = require('./BaseAsyncProvider.js');

class FutureAsyncProvider extends BaseAsyncProvider {
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

  onQuery(sender, correlation) {
    const sub = {
      sender,
      correlation
    }
    this.subscribers.push(sub);
    this.doCallback(sub);
  }
}

module.exports = FutureAsyncProvider;
