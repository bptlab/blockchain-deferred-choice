const BaseAsyncProvider = require('./BaseAsyncProvider.js');

class PastAsyncProvider extends BaseAsyncProvider {
  values = [0, 0];

  static getContractPrefix() {
    return 'PastAsync';
  }

  getQueryParameterTypes() {
    return [ 'uint256' ];
  }

  onDataUpdate(value) {
    super.onDataUpdate(value);
    this.values.push(
      Math.ceil(Date.now() / 1000),
      value
    );
  }

  onQuery(sender, correlation, from) {
    from = Number.parseInt(from);

    let first = 0;
    while (first + 2 < this.values.length && this.values[first + 2] < from) {
      first += 2;
    }

    this.sendConsumer(
      sender,
      correlation,
      'uint256[]',
      this.values.slice(first)
    );
  }
}

module.exports = PastAsyncProvider;
