const util = require('./../util.js');

/* abstract */ class BaseProvider {
  name;
  contract;
  gasUsed = 0;

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

  static getContractName() {
    return undefined;
  }

  static getTemplateOptions() {
    return undefined;
  }

  getGasUsed() {
    return this.gasUsed;
  }

  onValueChange(value) {
    console.log('O[', this.name, ']', 'Value change:', value);
  }

  onContractEvent(event) {
    console.log('O[', this.name, ']', 'Event:', event.event, '|', 'RESULT', event.returnValues);
  }
}

module.exports = BaseProvider;
