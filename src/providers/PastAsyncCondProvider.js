const PastAsyncProvider = require('./PastAsyncProvider.js');

const util = require('./../util.js');

class PastAsyncCondProvider extends PastAsyncProvider {
  static getContractPrefix() {
    return 'PastAsyncCond';
  }

  onContractEvent(event) {
    super.onContractEvent(event);
    if (event.event = 'Query') {
      const from = Number.parseInt(event.returnValues.from);
      const condition = event.returnValues.condition;
      console.log(event.returnValues);

      let first = 0;
      while (first + 2 < this.values.length && this.values[first + 2] < from) {
        first += 2;
      }

      let result;
      while (!result && first < this.values.length) {
        if (util.checkCondition(condition, this.values[first + 1])) {
          result = Math.max(from, this.values[first]);
        }
        first += 2;
      }
      result = result || util.TOP_TIMESTAMP;
      console.log("RESSSSSSULT", result);

      new util.web3.eth.Contract(
        util.getSpec('OracleValueConsumer').abi,
        event.returnValues.sender
      ).methods.oracleCallback(
        event.returnValues.correlation,
        result
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

module.exports = PastAsyncCondProvider;
