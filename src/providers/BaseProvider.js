const util = require('./../util.js');

/* abstract */ class BaseProvider {
  name;
  contract;
  account;
  receipts = [];

  constructor(name, contract, account) {
    this.name = name;
    this.contract = contract;
    this.account = account;

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
    console.log(this.name, 'Event:', event.event, '|', 'RESULT', JSON.stringify(event.returnValues));
  }
}

module.exports = BaseProvider;
