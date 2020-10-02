const OracleSimulator = require('./OracleSimulator.js');
const ChoiceSimulator = require('./ChoiceSimulator.js');

const util = require('../util.js');

class Simulation {
  config;
  ProviderClazz;

  constructor(config, ProviderClazz) {
    this.config = config;
    this.ProviderClazz = ProviderClazz;
  }

  async perform(scaling) {
    const oracles = this.config.oracles.map(c => new OracleSimulator(c, this.ProviderClazz));
    const choices = this.config.choices.map(c => new ChoiceSimulator(c, this.ProviderClazz));

    // Deploy all oracles and collect their addresses, since they need to be provided
    // to the choice contracts later
    console.log("Start deploying oracles...");
    const addresses = await Promise.all(
      oracles.map(o => o.deploy())
    );
    let addressMap = {};
    addresses.forEach((addr, i) => addressMap[oracles[i].config.name] = addr);
    console.log("Finished deploying oracles");

    // Deploy all choices
    console.log("Start deploying choices...");
    await Promise.all(
      choices.map(c => c.deploy(addressMap, scaling))
    );
    console.log("Finished deploying choices");

    // Start and await all simulations
    console.log("Start simulations...");
    await Promise.all(
      [].concat(oracles, choices).map(sim => sim.simulate(scaling))
    );
    console.log("Finished simulations");

    // Only start gathering statistics when all transactions finished
    console.log("Wait for pending transactions...");
    await util.waitForPending();

    console.log("Start preparing statistics...");
    let output = {
      name: this.config.name,
      clazz: this.ProviderClazz.getContractPrefix()
    };

    const winners = await Promise.all(choices.map(choice => choice.contract.methods.winner().call()));
    output.w = Object.assign({}, ...winners.map(
      (winner, i) => ({ ['w' + i]: winner })
    ));

    const actTimes = await Promise.all(choices.map(choice => choice.contract.methods.activationTime().call()));
    output.a = Object.assign({}, ...actTimes.map(
      (actTime, i) => ({ ['a' + i]: actTime })
    ));

    const choiceEvals = await Promise.all(choices.map(async choice => {
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
      ...oracles.map((oracle, i) => ({ ['o' + i]: oracle.receipts[0].gasUsed })),
      ...choices.map((choice, i) => ({ ['c' + i]: choice.receipts[0].gasUsed }))
    );

    output.gt = Object.assign(
      {},
      ...oracles.map((oracle, i) => ({ ['o' + i]: oracle.getGasUsed() - oracle.receipts[0].gasUsed })),
      ...choices.map((choice, i) => ({ ['c' + i]: choice.getGasUsed() - choice.receipts[0].gasUsed }))
    );

    output.tx = Object.assign(
      {},
      ...oracles.map((oracle, i) => ({ ['o' + i]: oracle.getTxCount() })),
      ...choices.map((choice, i) => ({ ['c' + i]: choice.getTxCount() }))
    );

    console.log("Finished preparing statistics");
    return output;
  }
}

module.exports = Simulation;
