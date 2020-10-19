const BaseSyncProvider = require('./BaseSyncProvider.js');

class PresentSyncProvider extends BaseSyncProvider {
  static getContractPrefix() {
    return 'PresentSync';
  }
}

module.exports = PresentSyncProvider;
