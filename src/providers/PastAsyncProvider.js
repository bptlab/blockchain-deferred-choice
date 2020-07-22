const BaseProvider = require('./BaseProvider.js');

const util = require('./../util.js');

class PastAsyncProvider extends BaseProvider {
  values = [];

  static getContractPrefix() {
    return 'PastAsync';
  }

  onValueChange(value) {
    super.onValueChange(value);
    this.values.push({
      value,
      timestamp: Math.ceil(Date.now() / 1000)
    });
  }

  onContractEvent(event) {
    super.onContractEvent(event);
    if (event.event = 'Query') {
      // Extract from timestamp from parameters and find the index at which
      // we have to start returning values
      const from = event.returnValues.from;
      let first = 0;

      while (first + 2 < this.values.length && this.values[first + 2] < from) {
        first += 2;
      }

      new util.web3.eth.Contract(
        util.getSpec('OracleValueArrayConsumer').abi,
        event.returnValues.sender
      ).methods.oracleCallback(
        event.returnValues.correlation,
        this.values.slice(first).map(v => [v.timestamp, v.value]).flat()
      ).send({
        from: this.contract.defaultAccount,
        nonce: util.getNonce(this.contract.defaultAccount),
        ...util.defaultOptions
      }).on('transactionHash', hash => {
        console.log('O[', this.name, ']', 'Callback:', event.returnValues.sender, '|', 'HASH', hash);
      }).on('receipt', receipt => {
        console.log('O[', this.name, ']', 'Callback:', event.returnValues.sender, '|', 'RECEIPT');
        this.gasUsed += receipt.gasUsed;
      }).on('error', error => {
        console.log('O[', this.name, ']', 'Callback:', event.returnValues.sender, '|', 'FAILED', error);
      });
    }
  }
}

module.exports = PastAsyncProvider;
