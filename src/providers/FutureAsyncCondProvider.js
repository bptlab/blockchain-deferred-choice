const FutureAsyncProvider = require('./FutureAsyncProvider.js');

const util = require('./../util.js');

class FutureAsyncCondProvider extends FutureAsyncProvider {
  static getContractPrefix() {
    return 'FutureAsyncCond';
  }

  doCallback(subscriber) {
    if (subscriber.unsubscribed) {
      return;
    }

    if (util.checkExpression(subscriber.expression, this.currentValue)) {
      subscriber.unsubscribed = true;
      this.sendConsumer(subscriber.sender, subscriber.correlation);
    }
  }
}

module.exports = FutureAsyncCondProvider;
