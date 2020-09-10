const BaseAsyncProvider = require('./BaseAsyncProvider.js');

const util = require('./../util.js');

class PresentAsyncCondProvider extends BaseAsyncProvider {
  currentValue = 0;

  static getContractPrefix() {
    return 'PresentAsyncCond';
  }

  getQueryParameterTypes() {
    return [ util.expressionType ];
  }

  onDataUpdate(value) {
    this.currentValue = value;
  }

  onQuery(sender, correlation, expression) {
    const result = util.checkExpression(expression, this.currentValue);
    this.sendConsumer(
      sender,
      correlation,
      'bool',
      result
    );
  }
}

module.exports = PresentAsyncCondProvider;
