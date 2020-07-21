const BaseAsyncProvider = require('./BaseAsyncProvider.js');

const util = require('./../util.js');

class PresentAsyncProvider extends BaseAsyncProvider {
  currentValue;

  static getContractPrefix() {
    return 'PresentAsync';
  }

  onValueChange(value) {
    this.currentValue = value;
  }

  onContractEvent(event) {
    super.onContractEvent(event);
    if (event.event = 'Query') {
      new util.web3.eth.Contract(
        util.getSpec('OracleValueConsumer').abi,
        event.returnValues.sender
      ).methods.oracleCallback(
        this.contract.options.address,
        event.returnValues.correlation,
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
  }
}

module.exports = PresentAsyncProvider;
