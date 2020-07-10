const util = require('../util.js');

class ChoiceInstance {
  config;
  contract;

  constructor(config) {
    this.config = config;
  }

  async deploy(oracleInstances) {
    const spec = util.getSpec('BaseDeferredChoice');
    this.contract = await new util.web3.eth.Contract(spec.abi, undefined, {
      from: this.config.account,
      ...util.defaultOptions,
      data: spec.evm.bytecode.object
    }).deploy({
      arguments: [ this.config.convertToEthereum(oracleInstances) ]
    }).send().on('transactionHash', hash => {
      console.log('HASH', hash);
    }).on('receipt', receipt => {
      console.log('RECEIPT', receipt.contractAddress);
    }).on('error', error => {
      console.error('ERROR', error);
    })
  
    // Subscribe to events for logging purposes
    this.contract.events.allEvents({
      fromBlock: 'latest'
    }).on('data', data => {
      console.log('EVENT', data.event, data.returnValues);
    }).on('error', error => {
      console.error('ERROR', error);
    });
  }

  async replay() {
    this.replayTime = 0;
    this.replayStep = 0;
    this.replayPrev = Date.now();

    return new Promise(resolve => {
      const step = () => {
        const curStep = this.config.timeline[this.replayStep];
        if (!curStep.target) {
          // Activate the choice
          this.contract.methods.activate().send({
            from: this.config.account,
            ...util.defaultOptions
          }).on('transactionHash', hash => {
            console.log('UPDATE HASH', hash);
          }).on('receipt', receipt => {
            console.log('UPDATE RECEIPT');
          }).on('error', console.error);
        } else {
          // Trigger the specific target event
          this.contract.methods.tryTrigger(curStep.target).send({
            from: this.config.account,
            ...util.defaultOptions
          }).on('transactionHash', hash => {
            console.log('UPDATE HASH', hash);
          }).on('receipt', receipt => {
            console.log('UPDATE RECEIPT');
          }).on('error', console.error);
        }

        this.replayStep++;
        if (this.replayStep < this.config.timeline.length) {
          const oldTimer = this.replayPrev;
          const newTimer = Date.now();
          this.replayTime += newTimer - oldTimer;
          setTimeout(step.bind(this), this.config.timeline[this.replayStep].at - this.replayTime);
          this.replayPrev = newTimer;
        } else {
          return resolve();
        }
      }
      step.call(this);
    });
  }

}

module.exports = ChoiceInstance;
