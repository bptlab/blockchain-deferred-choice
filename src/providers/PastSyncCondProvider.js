const BaseSyncProvider = require('./BaseSyncProvider.js');

class PastSyncCondProvider extends BaseSyncProvider {
  static getContractPrefix() {
    return 'PastSyncCond';
  }
}

module.exports = PastSyncCondProvider;
