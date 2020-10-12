const BaseSyncProvider = require('./BaseSyncProvider.js');

const util = require('./../util.js');

class PastSyncCondProvider extends BaseSyncProvider {
  static getContractPrefix() {
    return 'PastSyncCond';
  }
}

module.exports = PastSyncCondProvider;
