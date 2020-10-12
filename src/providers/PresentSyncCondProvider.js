const BaseSyncProvider = require('./BaseSyncProvider.js');

const util = require('./../util.js');

class PresentSyncCondProvider extends BaseSyncProvider {
  static getContractPrefix() {
    return 'PresentSyncCond';
  }
}

module.exports = PresentSyncCondProvider;
