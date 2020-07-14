const OracleInstance = require('./OracleInstance.js');
const ChoiceInstance = require('./ChoiceInstance.js');

class InstanceBatch {
  oracles;
  choices;

  constructor(choiceConfigs, oracleConfigs, ProviderClazz) {
    this.oracles = oracleConfigs.map(config => new OracleInstance(config, ProviderClazz));
    this.choices = choiceConfigs.map(config => new ChoiceInstance(config))
  }

  async simulate() {
    await this.deploy();
    await this.replay();

    // Output some statistics
    await new Promise(resolve => setTimeout(resolve, 5000));
    await Promise.all(this.choices.map(async choice => {
      const results = await Promise.all(choice.events.map(
        (_, i) => choice.contract.methods.getState(i).call()
      ));
      console.log('RESULTS', results);
    }));
    console.log('Oracles gas used: ', this.oracles.map(oracle => oracle.getGasUsed()));
    console.log('Choices gas used: ', this.choices.map(choice => choice.getGasUsed()));
  }

  async deploy() {
    // Deploy all oracles
    let oracleAddresses = {};
    for (let i = 0; i < this.oracles.length; i++) {
      oracleAddresses[this.oracles[i].name] = await this.oracles[i].deploy();
    }

    // Deploy all choices
    for (let i = 0; i < this.choices.length; i++) {
      await this.choices[i].deploy(oracleAddresses);
    }
  }

  async replay() {
    // Wait for all oracles' and choices' replay promises to resolve
    await Promise.all(
      this.oracles.concat(this.choices).map(inst => inst.replay())
    );
  }
}

module.exports = InstanceBatch;
