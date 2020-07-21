const OracleInstance = require('./OracleInstance.js');
const ChoiceInstance = require('./ChoiceInstance.js');

class InstanceBatch {
  oracles;
  choices;
  ProviderClazz;

  constructor(choiceConfigs, oracleConfigs, ProviderClazz) {
    this.oracles = oracleConfigs.map(config => new OracleInstance(config, ProviderClazz));
    this.choices = choiceConfigs.map(config => new ChoiceInstance(config, ProviderClazz));
    this.ProviderClazz = ProviderClazz;
  }

  async simulate() {
    await this.deploy();
    await this.replay();

    // Output some statistics after a while
    await new Promise(resolve => setTimeout(resolve, 3000));
    let output = {
      clazz: this.ProviderClazz.getContractPrefix()
    };
    const choiceStates = await Promise.all(this.choices.map(async choice => {
      const states = await Promise.all(choice.config.events.map(
        (_, i) => choice.contract.methods.getState(i).call()
      ));
      return Object.assign({}, ...states.map((state, i) => ({ ['e' + i]: state })));
    }))
    output.s = Object.assign({}, ...choiceStates.map(
      (choiceState, i) => ({ ['c' + i]: choiceState })
    ));
    output.g = Object.assign(
      {},
      ...this.oracles.map((oracle, i) => ({ ['o' + i]: oracle.getGasUsed() })),
      ...this.choices.map((choice, i) => ({ ['c' + i]: choice.getGasUsed() }))
    );
    return output;
  }

  async deploy() {
    // Deploy all oracles
    let oracleAddresses = {};
    for (let i = 0; i < this.oracles.length; i++) {
      oracleAddresses[this.oracles[i].config.name] = await this.oracles[i].deploy();
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
