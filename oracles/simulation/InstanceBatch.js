const OracleInstance = require('./OracleInstance.js');
const ChoiceInstance = require('./ChoiceInstance.js');

class InstanceBatch {
  oracles = [];
  choices = [];

  constructor(choiceConfigs, oracleConfigs) {
    this.choiceConfigs = choiceConfigs;
    this.oracleConfigs = oracleConfigs;
  }

  async deploy() {
    // Deploy all oracles
    let oracleMap = {};
    for (let i = 0; i < this.oracleConfigs.length; i++) {
      const config = this.oracleConfigs[i];
      const instance = new OracleInstance(config);
      await instance.deploy();
      this.oracles.push(instance);
      oracleMap[config.name] = instance.getAddress();
    }

    // Deploy all choices
    for (let i = 0; i < this.choiceConfigs.length; i++) {
      const config = this.choiceConfigs[i];
      const instance = new ChoiceInstance(config);
      await instance.deploy(oracleMap);
      this.choices.push(instance);
    }
  }

  async replay() {
    // Wait for all oracles' and choices' replay promises to resolve
    await Promise.all(
      this.oracles.concat(this.choices).map(inst => inst.replay())
    );

    // Check whether the right events "won"
    await new Promise(resolve => setTimeout(resolve, 5000));
    await Promise.all(this.choices.map(async choice => {
      const results = await Promise.all(choice.config.events.map(
        (_, i) => choice.contract.methods.getState(i).call()
      ));
      console.log('RESULTS', results, 'EXPECTED', choice.config.winner);
    }));
    console.log('Oracles gas used: ', this.oracles.map(oracle => oracle.getGasUsed()));
    console.log('Choices gas used: ', this.choices.map(choice => choice.getGasUsed()));
  }
}

module.exports = InstanceBatch;
