const BaseAsyncProvider = require('./BaseAsyncProvider.js');

const util = require('./../util.js');

class FutureAsyncCondProvider extends BaseAsyncProvider {
  subscribers = [];
  currentValue = 0;

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

  onDataUpdate(value) {
    super.onDataUpdate(value);
    this.currentValue = value;
    this.subscribers.forEach(sub => {
      this.doCallback(sub);
    });
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
