const BaseProvider = require('./BaseProvider.js');

const util = require('./../util.js');

class PresentAsyncProvider extends BaseProvider {
  currentValue = 0;

  static getContractPrefix() {
    return 'PresentAsync';
  }

  onValueChange(value) {
    this.currentValue = value;
  }

  onContractEvent(event) {
    super.onContractEvent(event);
    if (event.event = 'Query') {
      util.wrapTx(
        this.name,
        'oracleCallback',
        new util.web3.eth.Contract(
          util.getSpec('OracleValueConsumer').abi,
          event.returnValues.sender
        ).methods.oracleCallback(
          event.returnValues.correlation,
          this.currentValue
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

module.exports = PresentAsyncProvider;
