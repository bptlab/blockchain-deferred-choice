const BaseAsyncProvider = require('./BaseAsyncProvider.js');

class FutureAsyncProvider extends BaseAsyncProvider {
  subscribers = [];

  getSpec(specs) {
    return specs['FutureAsyncOracle'];
  }

  onValueChange(value) {
    super.onValueChange(value);
    this.subscribers.forEach(sub => {
      this.doCallback(sub.sender, sub.correlation, ['int256'], [this.currentValue]);
    });
  }

  onQuery(sender, correlation, params) {
    super.onQuery(sender, correlation, params);
    this.subscribers.push({
      sender, correlation, params
    });
    this.doCallback(sender, correlation, ['int256'], [this.currentValue]);
  }
}

module.exports = FutureAsyncProvider;
