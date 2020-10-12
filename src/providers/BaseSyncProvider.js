const BaseProvider = require('./BaseProvider.js');

const util = require('./../util.js');

/* abstract */ class BaseSyncProvider extends BaseProvider {

  onDataUpdate(value) {
    super.onDataUpdate(value);
    util.wrapTx(
      this.name,
      'set',
      this.receipts,
      this.contract.methods.set(
        util.web3.eth.abi.encodeParameter('uint256', value)
      ).send({
        nonce: util.getNonce(this.account),
        ...util.defaultOptions
      })
    );
  }

}

module.exports = BaseSyncProvider;
