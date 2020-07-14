const Replayer = require('./Replayer.js');

const util = require('../util.js');

class ChoiceInstance extends Replayer {
  config;
  contract;

  constructor(config) {
    super(config.timeline);
    this.config = config;
  }

  async deploy(oracleAddresses) {
    const spec = util.getSpec('BaseDeferredChoice');
    this.contract = await new util.web3.eth.Contract(spec.abi, undefined, {
      from: this.config.account,
      ...util.defaultOptions,
      data: spec.evm.bytecode.object
    }).deploy({
      arguments: [ this.config.convertToEthereum(oracleAddresses) ]
    }).send().on('transactionHash', hash => {
      console.log('C[]', 'Deployment', '|', 'HASH', hash);
    }).on('receipt', receipt => {
      console.log('C[]', 'Deployment', '|', 'RECEIPT', receipt.contractAddress);
    }).on('error', console.error);
    this.contract.defaultAccount = this.config.account;
  
    // Subscribe to events for logging purposes
    this.contract.events.allEvents({
      fromBlock: 'latest'
    }).on('data', data => {
      console.log('C[]', 'Event:', data.event, '|', 'RESULT', data.returnValues);
    }).on('error', console.error);
  }

  onReplayStep(index, context) {
    super.onReplayStep(index, context);
    if (index == 0) {
      // Activate the choice
      this.contract.methods.activate().send({
        ...util.defaultOptions
      }).on('transactionHash', hash => {
        console.log('C[]', 'Activation', '|', 'HASH', hash);
      }).on('receipt', receipt => {
        console.log('C[]', 'Activation', '|', 'RECEIPT');
      }).on('error', console.error);
    } else {
      // Trigger the specific target event
      this.contract.methods.tryTrigger(context.target).send({
        ...util.defaultOptions
      }).on('transactionHash', hash => {
        console.log('C[]', 'Trigger:', context.target, '|', 'HASH', hash);
      }).on('receipt', receipt => {
        console.log('C[]', 'Trigger:', context.target, '|', 'RECEIPT');
      }).on('error', console.error);
    }
  }
}

module.exports = ChoiceInstance;
