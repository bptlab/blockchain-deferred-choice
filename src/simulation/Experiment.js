const OracleInstance = require('./OracleInstance.js');
const ChoiceInstance = require('./ChoiceInstance.js');

class Experiment {
  oracles;
  choices;
  ProviderClazz;

  constructor(config, ProviderClazz) {
    this.oracles = config.oracles.map(name => {
      const oracleConfig = require('./../configs/oracles/' + name + '.json');
      return new OracleInstance(config.timelines[name], oracleConfig, ProviderClazz)
    });
    this.choices = config.choices.map(name => {
      const choiceConfig = require('./../configs/choices/' + name + '.json');
      return new ChoiceInstance(config.timelines[name], choiceConfig, ProviderClazz)
    });
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

  /**
   * Deploy the oracle and choice contracts which are part of this simulation.
   * 
   * @param {Number} scaling Temporal scaling factor
   */
  async deploy(scaling) {
    // Deploy all oracles and collect their addresses, since they need to be provided
    // to the choice contracts later
    let oracleAddresses = {};
    console.log("Start deploying oracles...");
    for (let i = 0; i < this.oracles.length; i++) {
      const oracle = this.oracles[i];
      oracleAddresses[oracle.config.name] = await oracle.deploy();
    }
    console.log("Finished deploying oracles");

    // Deploy all choices
    console.log("Start deploying choices...");
    for (let i = 0; i < this.choices.length; i++) {
      await this.choices[i].deploy(oracleAddresses, scaling);
    }
    console.log("Finished deploying choices");
  }

  /**
   * Perform the simulation by replaying all oracle and choice simulators.
   * 
   * @param {Number} scaling 
   */
  async replay(scaling) {
    await Promise.all(
      this.oracles.concat(this.choices).map(inst => inst.replay(scaling))
    );
  }
}

module.exports = Experiment;
