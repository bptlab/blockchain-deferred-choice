const BaseAsyncProvider = require('./BaseAsyncProvider.js');

const util = require('./../util.js');

class PastAsyncCondProvider extends BaseAsyncProvider {
  values = [0, 0];

  static getContractPrefix() {
    return 'PastAsyncCond';
  }

  getQueryParameterTypes() {
    return [ util.expressionType, 'uint256' ];
  }

  onValueChange(value) {
    super.onValueChange(value);
    this.values.push(
      Math.ceil(Date.now() / 1000),
      value
    );
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
