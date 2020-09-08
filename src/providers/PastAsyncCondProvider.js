const BaseProvider = require('./BaseProvider.js');

const util = require('./../util.js');

class PastAsyncCondProvider extends BaseProvider {
  values = [0, 0];

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
      const expression = event.returnValues.expression;

      let first = 0;
      while (first + 2 < this.values.length && this.values[first + 2] < from) {
        first += 2;
      }

      let result;
      while (!result && first < this.values.length) {
        if (util.checkExpression(expression, this.values[first + 1])) {
          result = Math.max(from, this.values[first]);
        }
        first += 2;
      }
      result = result || util.TOP_TIMESTAMP;

      util.wrapTx(
        this.name,
        'oracleCallback',
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
        }).on('receipt', receipt => {
          this.receipts.push(receipt);
        })
      );
    }
  }
}

module.exports = PastAsyncCondProvider;
