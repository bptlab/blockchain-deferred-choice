const BaseSyncProvider = require('./BaseSyncProvider.js');

const util = require('./../util.js');

class PresentSyncProvider extends BaseSyncProvider {
  static getContractPrefix() {
    return 'PresentSync';
  }
}

module.exports = PresentSyncProvider;
