const PresentSyncProvider = require('./PresentSyncProvider.js');

// For now, the PastSyncProvider works exactly the same as the PresentSyncProvider.
// The difference is in the smart contract on-chain.
class PastSyncProvider extends PresentSyncProvider {
  getSpec() {
    return this.specs['PastSyncOracle'];
  }
}

module.exports = PastSyncProvider;
