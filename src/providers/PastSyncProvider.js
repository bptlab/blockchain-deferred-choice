const BaseSyncProvider = require('./BaseSyncProvider.js');

class PastSyncProvider extends BaseSyncProvider {
  static getContractPrefix() {
    return 'PastSync';
  }
}

module.exports = PastSyncProvider;
