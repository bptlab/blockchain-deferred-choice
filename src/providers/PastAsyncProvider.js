const BaseProvider = require('./BaseProvider.js');

class PastAsyncProvider extends BaseProvider {
  values = [0, 0];

  static getContractPrefix() {
    return 'PastAsync';
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
      // Extract from timestamp from parameters and find the index at which
      // we have to start returning values
      const from = Number.parseInt(event.returnValues.from);
      let first = 0;
      while (first + 2 < this.values.length && this.values[first + 2] < from) {
        first += 2;
      }

      this.sendConsumer(
        event.returnValues.sender,
        event.returnValues.correlation,
        'uint256[]',
        this.values.slice(first)
      );
    }
  }
}

module.exports = PastAsyncProvider;
