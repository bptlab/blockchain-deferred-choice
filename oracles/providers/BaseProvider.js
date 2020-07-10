const util = require('./../util.js');

/* abstract */ class BaseProvider {
  name;
  account;
  contract;

  constructor(name, account) {
    this.name = name;
    this.account = account;
  }

  link(contract) {
    this.contract = contract;

    // Subscribe to contract events for logging purposes
    this.contract.events.allEvents({
      fromBlock: 'latest'
    }).on('data', data => {
      console.log(this.name, 'EVENT', data);
      this.onContractEvent(data);
    }).on('error', error => {
      console.error(this.name, 'ERROR', error);
    })
  }

  getSpec() {
    return undefined;
  }

  onValueChange(value) {
    console.log(this.name, 'VALUE_CHANGE', value);
  }

  onContractEvent(event) {
    console.log(this.name, 'EVENT', event.event);
  }
}

module.exports = BaseProvider;
