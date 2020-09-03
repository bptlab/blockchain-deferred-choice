const OracleSimulator = require('./OracleSimulator.js');
const ChoiceSimulator = require('./ChoiceSimulator.js');

class Simulation {
  oracles;
  choices;
  ProviderClazz;

  constructor(config, ProviderClazz) {
    this.oracles = config.oracles.map(name => {
      const oracleConfig = require('./../configs/oracles/' + name + '.json');
      return new OracleSimulator(config.timelines[name], oracleConfig, ProviderClazz)
    });
    this.choices = config.choices.map(name => {
      const choiceConfig = require('./../configs/choices/' + name + '.json');
      return new ChoiceSimulator(config.timelines[name], choiceConfig, ProviderClazz)
    });
    this.ProviderClazz = ProviderClazz;
  }

  async perform(scaling) {
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

    // Start and await all simulations
    console.log("Start simulations...");
    await Promise.all(
      [].concat(this.oracles, this.choices).map(sim => sim.simulate(scaling))
    );
    console.log("Finished simulations");

    // Output some statistics after a while
    console.log("Wait for statistics...");
    await new Promise(resolve => setTimeout(resolve, 3000 * scaling));

    console.log("Start preparing statistics...");
    let output = {
      clazz: this.ProviderClazz.getContractPrefix()
    };

    const winners = await Promise.all(this.choices.map(choice => choice.contract.methods.winner().call()));
    output.w = Object.assign({}, ...winners.map(
      (winner, i) => ({ ['w' + i]: winner })
    ));

    const actTimes = await Promise.all(this.choices.map(choice => choice.contract.methods.activationTime().call()));
    output.a = Object.assign({}, ...actTimes.map(
      (actTime, i) => ({ ['a' + i]: actTime })
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

    output.gd = Object.assign(
      {},
      ...this.oracles.map((oracle, i) => ({ ['o' + i]: oracle.receipts[0].gasUsed })),
      ...this.choices.map((choice, i) => ({ ['c' + i]: choice.receipts[0].gasUsed }))
    );

    output.gt = Object.assign(
      {},
      ...this.oracles.map((oracle, i) => ({ ['o' + i]: oracle.getGasUsed() - oracle.receipts[0].gasUsed })),
      ...this.choices.map((choice, i) => ({ ['c' + i]: choice.getGasUsed() - choice.receipts[0].gasUsed }))
    );

    output.tx = Object.assign(
      {},
      ...this.oracles.map((oracle, i) => ({ ['o' + i]: oracle.getTxCount() })),
      ...this.choices.map((choice, i) => ({ ['c' + i]: choice.getTxCount() }))
    );

    console.log("Finished preparing statistics");
    return output;
  }
}

module.exports = Simulation;
