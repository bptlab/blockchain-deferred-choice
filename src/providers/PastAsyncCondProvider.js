const BaseProvider = require('./BaseProvider.js');

const util = require('./../util.js');

class PastAsyncCondProvider extends BaseProvider {
  values = [];

  static getContractPrefix() {
    return 'PastAsyncCond';
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
      const from = Number.parseInt(event.returnValues.from);
      const condition = event.returnValues.condition;

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
