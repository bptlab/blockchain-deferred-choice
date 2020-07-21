const BaseProvider = require('./BaseProvider.js');

const util = require('./../util.js');

class FutureAsyncProvider extends BaseProvider {
  subscribers = [];
  currentValue;

  static getContractPrefix() {
    return 'FutureAsync';
  }

  doCallback(subscriber) {
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
    }).on('transactionHash', hash => {
      console.log('O[', this.name, ']', 'Callback:', subscriber.sender, '|', 'HASH', hash);
    }).on('receipt', receipt => {
      console.log('O[', this.name, ']', 'Callback:', subscriber.sender, '|', 'RECEIPT');
      this.gasUsed += receipt.gasUsed;
    }).on('error', error => {
      console.log('O[', this.name, ']', 'Callback:', subscriber.sender, '|', 'FAILED', error);
    });
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
      const sub = {
        sender: event.returnValues.sender,
        correlation: event.returnValues.correlation
      };
      this.subscribers.push(sub);
      this.doCallback(sub);
    }
  }
}

module.exports = FutureAsyncProvider;
