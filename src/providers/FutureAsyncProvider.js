const BaseProvider = require('./BaseProvider.js');

const util = require('./../util.js');

class FutureAsyncProvider extends BaseProvider {
  subscribers = [];
  currentValue;

  static getContractPrefix() {
    return 'FutureAsync';
  }

  doCallback(subscriber) {
    util.wrapTx(
      this.name,
      'oracleCallback',
      new util.web3.eth.Contract(
        util.getSpec('OracleValueConsumer').abi,
        subscriber.sender
      ).methods.oracleCallback(
        subscriber.correlation,
        this.currentValue
      ).send({
        from: this.contract.defaultAccount,
        nonce: util.getNonce(this.contract.defaultAccount),
        ...util.defaultOptions
      }).on('receipt', receipt => {
        this.gasUsed += receipt.gasUsed;
      })
    );
  }

  onValueChange(value) {
    super.onValueChange(value);
    this.currentValue = value;
    this.subscribers.forEach(sub => {
      this.doCallback(sub);
    });
  }

  onContractEvent(event) {
    super.onContractEvent(event);
    if (event.event = 'Query') {
      const sub = event.returnValues;
      this.subscribers.push(sub);
      this.doCallback(sub);
    }
  }
}

module.exports = FutureAsyncProvider;
