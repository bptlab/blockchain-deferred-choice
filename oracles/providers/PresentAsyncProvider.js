const BaseAsyncProvider = require('./BaseAsyncProvider.js');

class PresentAsyncProvider extends BaseAsyncProvider {
  currentValue;

  getSpec() {
    return this.specs['PresentAsyncOracle'];
  }

  onValueChange(value) {
    this.currentValue = value;
  }

  onQuery(sender, correlation, params) {
    super.onQuery(sender, correlation, params);
    this.doCallback(sender, correlation, ['uint256'], [this.currentValue]);
  }
}

module.exports = PresentAsyncProvider;
