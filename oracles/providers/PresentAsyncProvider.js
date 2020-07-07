const BaseAsyncProvider = require('./BaseAsyncProvider.js');

class PresentAsyncProvider extends BaseAsyncProvider {
  getSpec(specs) {
    return specs['RequestResponseOracle'];
  }

  onQuery(sender, correlation, params) {
    super.onQuery(sender, correlation, params);
    this.doCallback(sender, correlation, ['int256'], [this.currentValue]);
  }
}

module.exports = PresentAsyncProvider;
