const Simulator = require('./Simulator.js');

const util = require('../util.js');

class ChoiceSimulator extends Simulator {
  contract;
  config;
  gasUsed = 0;

  constructor(timeline, config, ProviderClazz) {
    super(timeline);
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

  async deploy(oracleAddresses, scaling = 1) {
    // Convert the events to Ethereum struct encoding
    const payload = this.config.events.map(event => {
      // Perform timer scaling. We add the current time to absolute timers, so
      // they are not static to a single date
      let timer = (event.timer || 0) * scaling;
      if (event.type == 'TIMER_ABSOLUTE') {
        timer += Math.ceil(Date.now() / 1000);
      }

      // Stick together the Ethereum struct array
      return [
        util.enums.EventDefinition[event.type],
        timer,
        event.oracleName ? oracleAddresses[event.oracleName] :
                          '0x0000000000000000000000000000000000000000',
        [
          event.operator ? util.enums.Operator[event.operator] : 0,
          event.value || 0
        ]
      ];
    });

    await util.wrapTx(
      this.config.name,
      'deploy',
      this.contract.deploy({
        arguments: [ payload ]
      }).send({
        nonce: util.getNonce(this.contract.defaultAccount)
      }).on('receipt', receipt => {
        this.gasUsed += receipt.gasUsed;
        this.contract.options.address = receipt.contractAddress;
      })
    );

    // Subscribe to events for logging purposes
    this.contract.events.allEvents({
      fromBlock: 'latest'
    }).on('data', data => {
      console.log(this.config.name, 'Event:', data.event, '|', 'RESULT', data.returnValues);
    }).on('error', console.error);

    return this.contract.options.address;
  }

  onAction(index, context) {
    super.onAction(index, context);
    if (index == 0) {
      // Activate the choice
      util.wrapTx(
        this.config.name,
        'activate',
        this.contract.methods.activate().send({
          nonce: util.getNonce(this.contract.defaultAccount),
          ...util.defaultOptions
        }).on('receipt', receipt => {
          this.gasUsed += receipt.gasUsed;
        })
      );
    } else {
      // Trigger the specific target event
      util.wrapTx(
        this.config.name,
        'trigger',
        this.contract.methods.trigger(context.target).send({
          nonce: util.getNonce(this.contract.defaultAccount),
          ...util.defaultOptions
        }).on('receipt', receipt => {
          this.gasUsed += receipt.gasUsed;
        })
      );
    }
  }
}

module.exports = ChoiceSimulator;
