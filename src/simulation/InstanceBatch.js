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

  async simulate(scaling) {
    await this.deploy(scaling);
    await this.replay(scaling);

    // Output some statistics after a while
    await new Promise(resolve => setTimeout(resolve, 3000 * scaling));
    let output = {
      clazz: this.ProviderClazz.getContractPrefix()
    };

    const winners = await Promise.all(this.choices.map(choice => choice.contract.methods.winner().call()));
    output.w = Object.assign({}, ...winners.map(
      (winner, i) => ({ ['w' + i]: winner })
    ));

    const choiceEvals = await Promise.all(this.choices.map(async choice => {
      const evals = await Promise.all(choice.config.events.map(
        (_, i) => choice.contract.methods.evals(i).call()
      ));
      return Object.assign({}, ...evals.map((eva, i) => ({ ['e' + i]: eva })));
    }))
    output.e = Object.assign({}, ...choiceEvals.map(
      (choiceEval, i) => ({ ['c' + i]: choiceEval })
    ));

    output.g = Object.assign(
      {},
      ...this.oracles.map((oracle, i) => ({ ['o' + i]: oracle.getGasUsed() })),
      ...this.choices.map((choice, i) => ({ ['c' + i]: choice.getGasUsed() }))
    );
    return output;
  }

  async deploy(scaling) {
    // Deploy all oracles
    let oracleAddresses = {};
    for (let i = 0; i < this.oracles.length; i++) {
      oracleAddresses[this.oracles[i].config.name] = await this.oracles[i].deploy();
    }

    // Deploy all choices
    for (let i = 0; i < this.choices.length; i++) {
      await this.choices[i].deploy(oracleAddresses, scaling);
    }
  }

  async replay(scaling) {
    // Wait for all oracles' and choices' replay promises to resolve
    await Promise.all(
      this.oracles.concat(this.choices).map(inst => inst.replay(scaling))
    );
  }
}

module.exports = InstanceBatch;
