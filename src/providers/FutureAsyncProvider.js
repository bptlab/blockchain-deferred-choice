const BaseAsyncProvider = require('./BaseAsyncProvider.js');

const util = require('./../util.js');

class FutureAsyncProvider extends BaseAsyncProvider {
  subscribers = [];
  currentValue;

  static getContractName() {
    return 'FutureAsyncOracle';
  }

  static getTemplateOptions() {
    return {
      FUTURE: true,
      ASYNC: true
    };
  }

  doCallback(subscriber) {
    new util.web3.eth.Contract(
      util.getSpec('OracleValueConsumer').abi,
      subscriber.sender
    ).methods.oracleCallback(
      this.contract.options.address,
      subscriber.correlation,
      this.currentValue
    ).send({
      from: this.contract.defaultAccount,
      ...util.defaultOptions
    }).on('transactionHash', hash => {
      console.log('O[', this.name, ']', 'Callback:', consumerAddress, '|', 'HASH', hash);
    }).on('receipt', receipt => {
      console.log('O[', this.name, ']', 'Callback:', consumerAddress, '|', 'RECEIPT');
      this.gasUsed += receipt.gasUsed;
    }).on('error', error => {
      console.log('O[', this.name, ']', 'Callback:', consumerAddress, '|', 'FAILED');
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
