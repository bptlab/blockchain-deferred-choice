const util = require('./../util.js');

class Instance {
  contract;

  constructor(account, delay, events, timeline) {
    this.account = account;
    this.delay = delay;
    this.events = events;
    this.timeline = timeline;
  }

  async deploy() {
    const spec = util.getSpec('BaseDeferredChoice');
    this.contract = await new util.web3.eth.Contract(spec.abi, undefined, {
      from: this.account,
      ...util.defaultOptions,
      data: spec.evm.bytecode.object
    }).deploy({
      arguments: [this.events]
    }).send().on('transactionHash', hash => {
      console.log(this.name, 'HASH', hash);
    }).on('receipt', receipt => {
      console.log(this.name, 'RECEIPT', receipt.contractAddress);
    }).on('error', error => {
      console.error(this.name, 'ERROR', error);
    })
  
    this.contract.events.allEvents({
      fromBlock: 'latest'
    }).on('data', data => {
      console.log(this.name, 'EVENT', data.event, data.returnValues);
    }).on('error', error => {
      console.error(this.name, 'ERROR', error);
    });
  }

  async replay() {
    // wait for delay
    // activate contract
    // perform actions at specific time (trigger attempts)
  }
}

module.exports = Instance;
