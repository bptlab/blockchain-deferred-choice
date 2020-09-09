const BaseProvider = require('./BaseProvider.js');

const util = require('./../util.js');

class PastAsyncCondProvider extends BaseProvider {
  values = [0, 0];

  static getContractPrefix() {
    return 'PastAsyncCond';
  }

  onValueChange(value) {
    super.onValueChange(value);
    this.values.push(
      Math.ceil(Date.now() / 1000),
      value
    );
  }

  onContractEvent(event) {
    super.onContractEvent(event);
    if (event.event = 'Query') {
      const from = Number.parseInt(event.returnValues.from);
      const expression = event.returnValues.expression;

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
        event.returnValues.sender,
        event.returnValues.correlation,
        'uint256',
        result
      );
    }
  }
}

module.exports = PastAsyncCondProvider;
