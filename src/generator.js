const seedrandom = require('seedrandom');
const json2csv = require('json-2-csv');
const fs = require('fs-extra');

const util = require('./util.js');

const Simulation = require('./simulation/Simulation.js');

var rng = seedrandom('oracle');

// Experiment 1:
// One oracle instance
// In this experiment, the triggering behavior of the choice is irrelevant. We assume a worst-case, that is, nothing ever fires.

// Experiment 2:
// One choice instance
// In this experiment, the triggering behavior of the choice is irrelevant. We assume a worst-case, that is, nothing ever fires.

function generateConfig(oracles, choices, updates) {
  const name = "o" + ("000"+oracles).slice(-3) + "x" +
               "c" + ("000"+choices).slice(-3) + "x" +
               "u" + ("000"+updates).slice(-3);

  return {
    "name": name,
    "counts": {
      "o": oracles,
      "c": choices,
      "u": updates
    },
    "choices": Array(choices).fill().map((_, c) => ({
      "name": "OracleConsumer" + c,
      "account": "Consumer",
      "events": Array(oracles).fill().map((_, o) => ({
        "type": "CONDITIONAL",
        "oracleName": "Oracle" + o,
        "operator": "GREATER",
        "value": 100
      })),
      "timeline": [
        { "at": 0, "context": { "target": 0 }},
        { "at": updates + 1, "context": { "target": 0 }}
      ]
    })),
    "oracles": Array(oracles).fill().map((_, o) => ({
      "name": "Oracle" + o,
      "account": "Oracle",
      "timeline": Array(updates).fill().map((_, u) => ({
        "at": u,
        "context": {
          "value": Math.floor(rng() * 100)
        }
      }))
    }))
  };
}

function generateConfigs(oracleSteps, choiceSteps, updateSteps) {
  let configs = [];
  for (const oracles of oracleSteps) {
    for (const choices of choiceSteps) {
      for (const updates of updateSteps) {
        configs.push(generateConfig(oracles, choices, updates));
      }
    }
  }
  return configs;
}

async function run() {
  await util.init();

  let jsonBuffer = 'results_' + Date.now() + '.txt';
  let outputs = [];
  let configs;
  const scaling = 10;

  // Experiment 1
  configs = generateConfigs(
    [1], // oracles
    [1, 5, 10, 25, 50], // choices
    [1, 5, 10, 25, 50] // updates
  );

  // Experiment 2
  // configs = generateConfigs(
  //   [1, 2, 3, 4, 5], // oracles
  //   [1], // choices
  //   [1, 5, 10, 25, 50] // updates
  // );

  for (const [i, config] of configs.entries()) {
    for (const [j, provider] of util.getProviders().entries()) {
      console.log();
      console.log();
      console.log('Starting config', i + 1, '/', configs.length);
      console.log('Using provider', j + 1, '/', util.getProviders().length, provider.getContractPrefix());
      console.log('Counts: ', config.counts)
      console.log();

      const simulation = new Simulation(config, provider);
      const result = await simulation.perform(scaling);
      result.counts = config.counts;
      outputs.push(result);
      await fs.appendFile(jsonBuffer, JSON.stringify(result) + ',');
    }
  }

  console.log();
  console.log();
  console.log('Experiment finished!');

  const csv = await json2csv.json2csvAsync(outputs);
  await fs.outputFile('results_' + Date.now() + '.csv', csv);

  process.exit();
}

run();
