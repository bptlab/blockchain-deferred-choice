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

    if (util.checkExpression(subscriber.expression, this.currentValue)) {
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
          this.receipts.push(receipt);
        })
      );
    }
  }
}

module.exports = FutureAsyncCondProvider;
