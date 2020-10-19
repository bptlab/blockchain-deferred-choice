const PastAsyncProvider = require('./PastAsyncProvider.js');

const util = require('./../util.js');

class PastAsyncCondProvider extends PastAsyncProvider {
  static getContractPrefix() {
    return 'PastAsyncCond';
  }

  getQueryParameterTypes() {
    return [ util.expressionType, 'uint256' ];
  }

  onQuery(sender, correlation, expression, from) {
    from = Number.parseInt(from);

    let first = 0;
    while (first + 2 < this.values.length && this.values[first + 2] < from) {
      first += 2;
    }

    let result;
    while (!result && first < this.values.length) {
      if (util.checkExpression(expression, this.values[first + 1])) {
        result = Math.max(from, this.values[first]);
      }
      first += 2;
    }
    result = result || util.TOP_TIMESTAMP;

    this.sendConsumer(
      sender,
      correlation,
      'uint256',
      result
    );
  }
}

module.exports = PastAsyncCondProvider;
