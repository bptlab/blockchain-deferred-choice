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

  onDataUpdate(value) {
    console.log(this.name, 'Value change:', value);
  }

  onContractEvent(event) {
    console.log(this.name, 'Event:', event.event, '|', 'RESULT', event.returnValues);
  }
}

module.exports = BaseProvider;
