const BaseProvider = require('./BaseProvider.js');

const util = require('./../util.js');

class BaseAsyncProvider extends BaseProvider {
  onContractEvent(event) {
    super.onContractEvent(event);
    if (event.event == 'Query') {
      this.onQuery(
        event.returnValues.sender,
        event.returnValues.correlation,
        event.returnValues.params
      );
    }
  }

  onQuery(sender, correlation, params) {
    console.log('O[', this.name, ']', 'Query:', sender, correlation, params);
  }

  doCallback(consumerAddress, correlation, types, values) {
    const requester = new util.web3.eth.Contract(
      util.getSpec('OracleConsumer').abi,
      consumerAddress
    );
    requester.methods.oracleCallback(
      this.contract.options.address,
      correlation,
      util.web3.eth.abi.encodeParameters(types, values)
    ).send({
      from: this.contract.defaultAccount,
      ...util.defaultOptions
    }).on('transactionHash', hash => {
      console.log('O[', this.name, ']', 'Callback:', consumerAddress, '|', 'HASH', hash);
    }).on('receipt', receipt => {
      console.log('O[', this.name, ']', 'Callback:', consumerAddress, '|', 'RECEIPT');
    }).on('error', error => {
      console.log('O[', this.name, ']', 'Callback:', consumerAddress, '|', 'FAILED');
    });
  }
}

module.exports = BaseAsyncProvider;
