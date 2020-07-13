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
      console.log('HASH', hash);
    }).on('receipt', receipt => {
      console.log('RECEIPT', receipt.contractAddress);
    }).on('error', error => {
      console.error('ERROR', error);
    })
    this.contract.defaultAccount = this.config.account;
  
    // Subscribe to events for logging purposes
    this.contract.events.allEvents({
      fromBlock: 'latest'
    }).on('data', data => {
      console.log('EVENT', data.event, data.returnValues);
    }).on('error', error => {
      console.error('ERROR', error);
    });
  }

  onReplayStep(index, context) {
    super.onReplayStep(index, context);
    if (index == 0) {
      // Activate the choice
      this.contract.methods.activate().send({
        ...util.defaultOptions
      }).on('transactionHash', hash => {
        console.log('UPDATE HASH', hash);
      }).on('receipt', receipt => {
        console.log('UPDATE RECEIPT');
      }).on('error', console.error);
    } else {
      // Trigger the specific target event
      this.contract.methods.tryTrigger(context.target).send({
        ...util.defaultOptions
      }).on('transactionHash', hash => {
        console.log('UPDATE HASH', hash);
      }).on('receipt', receipt => {
        console.log('UPDATE RECEIPT');
      }).on('error', console.error);
    }
  }
}

module.exports = ChoiceInstance;
