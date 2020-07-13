const PresentSyncProvider = require('./PresentSyncProvider.js');

const util = require('./../util.js');

// For now, the PastSyncProvider works exactly the same as the PresentSyncProvider.
// The difference is in the smart contract on-chain.
class PastSyncProvider extends PresentSyncProvider {
  static getSpec() {
    return util.getSpec('PastSyncOracle');
  }
}

module.exports = PastSyncProvider;
