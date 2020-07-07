const BaseAsyncProvider = require('./BaseAsyncProvider.js');

class PastAsyncProvider extends BaseAsyncProvider {
  values = [];

  getSpec(specs) {
    return specs['PastAsyncOracle'];
  }

  onValueChange(value) {
    this.values.push({
      value,
      timestamp: Date.now()
    });
  }

  onQuery(sender, correlation, params) {
    super.onQuery(sender, correlation, params);
    // TODO get 'from' from params and return only those values
    this.doCallback(sender, correlation, ['uint256[]'], [
      this.values.map(v => [v.timestamp, v.value]).flat()
    ]);
  }
}

module.exports = PastAsyncProvider;
