const FutureAsyncProvider = require('./FutureAsyncProvider.js');

const util = require('./../util.js');

class FutureAsyncCondProvider extends FutureAsyncProvider {
  static getContractPrefix() {
    return 'FutureAsyncCond';
  }

  getQueryParameterTypes() {
    return [ util.expressionType ];
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

  onQuery(sender, correlation, expression) {
    const sub = {
      sender,
      correlation,
      expression
    }
    this.subscribers.push(sub);
    this.doCallback(sub);
  }
}

module.exports = FutureAsyncCondProvider;
