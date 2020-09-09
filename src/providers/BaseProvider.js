const util = require('./../util.js');

/* abstract */ class BaseProvider {
  name;
  contract;
  receipts = [];

  constructor(name, contract) {
    this.name = name;
    this.contract = contract;

    // Subscribe to contract events for logging purposes
    this.contract.events.allEvents({
      fromBlock: 'latest'
    }).on('data', data => {
      this.onContractEvent(data);
    }).on('error', console.error);
  }

  static getContractPrefix() {
    return undefined;
  }

  onValueChange(value) {
    console.log(this.name, 'Value change:', value);
  }

  onContractEvent(event) {
    console.log(this.name, 'Event:', event.event, '|', 'RESULT', event.returnValues);
  }

  sendConsumer(sender, correlation, valueType, value) {
    let payload = '0x';
    if (valueType) {
      payload = util.web3.eth.abi.encodeParameter(valueType, value)
    }
    util.wrapTx(
      this.name,
      'oracleCallback',
      new util.web3.eth.Contract(
        util.getSpec('OracleConsumer').abi,
        sender
      ).methods.oracleCallback(
        correlation,
        payload
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

module.exports = BaseProvider;
