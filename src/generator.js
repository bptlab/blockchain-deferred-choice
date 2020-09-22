const seedrandom = require('seedrandom');
const json2csv = require('json-2-csv');
const fs = require('fs-extra');

const util = require('./util.js');

const Simulation = require('./simulation/Simulation.js');

var rng = seedrandom('oracle');

// Experiment 1:
// One oracle instance
// [1, 10, 50, 100] updates
// [1, 5, 10, 25, 50] consumers
// In this experiment, the triggering behavior of the choice is irrelevant. We assume a worst-case, that is, nothing ever fires.

// Experiment 2:
// One choice instance
// [1, 10, 50, 100] updates
// [1, 2, 3, 4, 5] oracles
// In this experiment, the triggering behavior of the choice is irrelevant. We assume a worst-case, that is, nothing ever fires.

function generateConfig(oracles, choices, updates) {
  const name = "o" + ("000"+oracles).slice(-3) + "x" +
               "c" + ("000"+choices).slice(-3) + "x" +
               "u" + ("000"+updates).slice(-3);

  return {
    "name": name,
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

async function run() {
  await util.init();

  let outputs = [];
  const scaling = 5;

  const updateSteps = [1, 10, 50, 100];
  const oracleSteps = [1, 2, 3, 4, 5];
  const choiceSteps = [1, 5, 10, 25, 50];

  // for (const updates of updateSteps) {
  //   for (const choices of choiceSteps) {
  //     const config = generateConfig(1, choices, updates);
  //     for (const provider of util.getProviders()) {
  //       const simulation = new Simulation(config, provider);
  //       const result = await simulation.perform(scaling);
  //       outputs.push(result);
  //     }
  //   }
  // };

  for (const updates of updateSteps) {
    for (const oracles of oracleSteps) {
      const config = generateConfig(oracles, 1, updates);
      for (const provider of util.getProviders()) {
        const simulation = new Simulation(config, provider);
        const result = await simulation.perform(scaling);
        outputs.push(result);
      }
    }
  };

  console.log('FINAL RESULT');
  console.log(JSON.stringify(outputs, null, 2));

  const csv = await json2csv.json2csvAsync(outputs);
  await fs.outputFile('results_' + Date.now() + '.csv', csv);

  process.exit();
}

run();
