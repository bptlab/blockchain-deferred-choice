const BaseAsyncProvider = require('./BaseAsyncProvider.js');

const util = require('./../util.js');

class PastAsyncProvider extends BaseAsyncProvider {
  values = [];

  static getSpec() {
    return util.getSpec('PastAsyncOracle');
  }

  onValueChange(value) {
    super.onValueChange(value);
    this.values.push({
      value,
      timestamp: Date.now()
    });
  }

  onQuery(sender, correlation, params) {
    super.onQuery(sender, correlation, params);

    // Extract from timestamp from parameters and find the index at which
    // we have to start returning values
    const from = util.web3.eth.abi.decodeParameter('uint256', params);
    let first = 0;

    while (first + 2 < this.values.length && this.values[first + 2] < from) {
      first += 2;
    }

    this.doCallback(sender, correlation, ['uint256[]'], [
      this.values.slice(first).map(v => [v.timestamp, v.value]).flat()
    ]);
  }
}

module.exports = PastAsyncProvider;
