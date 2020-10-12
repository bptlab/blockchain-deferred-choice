const BaseSyncProvider = require('./BaseSyncProvider.js');

const util = require('./../util.js');

class PastSyncProvider extends BaseSyncProvider {
  static getContractPrefix() {
    return 'PastSync';
  }
}

module.exports = PastSyncProvider;
