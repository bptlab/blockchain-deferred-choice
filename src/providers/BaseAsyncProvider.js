const BaseProvider = require('./BaseProvider.js');

const util = require('./../util.js');

/* abstract */ class BaseAsyncProvider extends BaseProvider {

  onContractEvent(event) {
    super.onContractEvent(event);
    if (event.event = 'Query') {
      const query = event.returnValues;
      const types = this.getQueryParameterTypes();
      let list = [];
      if (types.length > 0) {
        const decoded = util.web3.eth.abi.decodeParameters(types, query.parameters);
        list = types.map((_, i) => decoded[i]);
      }
      this.onQuery(query.sender, query.correlation, ...list);
    }
  }

  getQueryParameterTypes() {
    return [];
  }

  onQuery(sender, correlation, ...parameters) {
    // Do something.
  }

  sendConsumer(sender, correlation, valueType, value) {
    let payload = '0x';
    if (valueType) {
      payload = util.web3.eth.abi.encodeParameter(valueType, value)
    }
    util.wrapTx(
      this.name,
      'oracleCallback',
      this.receipts,
      new util.web3.eth.Contract(
        util.getSpec('OracleConsumer').abi,
        sender
      ).methods.oracleCallback(
        correlation,
        payload
      ).send({
        from: util.getAccount(this.account),
        nonce: util.getNonce(this.account),
        ...util.defaultOptions
      })
    );
  }
}

module.exports = BaseAsyncProvider;
