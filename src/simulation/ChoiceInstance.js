const Replayer = require('./Replayer.js');

const util = require('../util.js');

class ChoiceInstance extends Replayer {
  contract;
  config;
  gasUsed = 0;

  constructor(config, ProviderClazz) {
    super(config.timeline);
    this.config = config;

    const spec = util.getSpec(ProviderClazz.getContractPrefix() + 'Choice');
    this.contract = new util.web3.eth.Contract(spec.abi, undefined, {
      from: util.getAccount(this.config.account),
      ...util.defaultOptions,
      data: spec.evm.bytecode.object
    });
    this.contract.defaultAccount = util.getAccount(this.config.account);
  }

  getGasUsed() {
    return this.gasUsed;
  }

  async deploy(oracleAddresses) {
    // Convert the events to Ethereum struct encoding
    const payload = this.config.events.map(event => [
      util.enums.EventDefinition[event.type],
      // For absolute timers, we regard the given timer value as an offset
      // to the current timestamp. Otherwise, configs would be rather static
      event.type == 'TIMER_ABSOLUTE'
                  ? event.timer + Math.ceil(Date.now() / 1000)
                  : (event.timer || 0),
      event.oracleName ? oracleAddresses[event.oracleName] :
                         '0x0000000000000000000000000000000000000000',
      [
        event.operator ? util.enums.Operator[event.operator] : 0,
        event.value || 0
      ]
    ]);

    await this.contract.deploy({
      arguments: [ payload ]
    }).send().on('transactionHash', hash => {
      console.log('C[]', 'Deployment', '|', 'HASH', hash);
    }).on('receipt', receipt => {
      console.log('C[]', 'Deployment', '|', 'RECEIPT', receipt.contractAddress);
      this.gasUsed += receipt.gasUsed;
      this.contract.options.address = receipt.contractAddress;
    }).on('error', console.error);
    
  
    // Subscribe to events for logging purposes
    this.contract.events.allEvents({
      fromBlock: 'latest'
    }).on('data', data => {
      console.log('C[]', 'Event:', data.event, '|', 'RESULT', data.returnValues);
    }).on('error', console.error);

    return this.contract.options.address;
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
        this.gasUsed += receipt.gasUsed;
      }).on('error', console.error);
    } else {
      // Trigger the specific target event
      this.contract.methods.tryTrigger(context.target).send({
        ...util.defaultOptions
      }).on('transactionHash', hash => {
        console.log('C[]', 'Trigger:', context.target, '|', 'HASH', hash);
      }).on('receipt', receipt => {
        console.log('C[]', 'Trigger:', context.target, '|', 'RECEIPT');
        this.gasUsed += receipt.gasUsed;
      }).on('error', console.error);
    }
  }
}

module.exports = ChoiceInstance;
