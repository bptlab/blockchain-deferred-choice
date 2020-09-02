const BaseProvider = require('./BaseProvider.js');

const util = require('./../util.js');

class PastAsyncProvider extends BaseProvider {
  values = [];

  static getContractPrefix() {
    return 'PastAsync';
  }

  onValueChange(value) {
    super.onValueChange(value);
    this.values.push(
      Math.ceil(Date.now() / 1000),
      value
    );
  }

  onContractEvent(event) {
    super.onContractEvent(event);
    if (event.event = 'Query') {
      // Extract from timestamp from parameters and find the index at which
      // we have to start returning values
      const from = Number.parseInt(event.returnValues.from);
      let first = 0;
      while (first + 2 < this.values.length && this.values[first + 2] < from) {
        first += 2;
      }

      util.wrapTx(
        this.name,
        'oracleCallback',
        new util.web3.eth.Contract(
          util.getSpec('OracleValueArrayConsumer').abi,
          event.returnValues.sender
        ).methods.oracleCallback(
          event.returnValues.correlation,
          this.values.slice(first)
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

module.exports = PastAsyncProvider;
