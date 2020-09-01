const FutureAsyncProvider = require('./FutureAsyncProvider.js');

const util = require('./../util.js');

class FutureAsyncCondProvider extends FutureAsyncProvider {
  static getContractPrefix() {
    return 'FutureAsyncCond';
  }

  doCallback(subscriber) {
    if (subscriber.unsubscribed) {
      return;
    }

    if (util.checkCondition(subscriber.condition, this.currentValue)) {
      subscriber.unsubscribed = true;
      util.wrapTx(
        this.name,
        'oracleCallback',
        new util.web3.eth.Contract(
          util.getSpec('OracleBoolConsumer').abi,
          subscriber.sender
        ).methods.oracleCallback(
          subscriber.correlation,
          true
        ).send({
          from: this.contract.defaultAccount,
          nonce: util.getNonce(this.contract.defaultAccount),
          ...util.defaultOptions
        }).on('receipt', receipt => {
          this.gasUsed += receipt.gasUsed;
        })
      );
    }
  }
}

module.exports = FutureAsyncCondProvider;
