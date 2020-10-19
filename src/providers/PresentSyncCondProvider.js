const BaseSyncProvider = require('./BaseSyncProvider.js');

class PresentSyncCondProvider extends BaseSyncProvider {
  static getContractPrefix() {
    return 'PresentSyncCond';
  }
}

module.exports = PresentSyncCondProvider;
