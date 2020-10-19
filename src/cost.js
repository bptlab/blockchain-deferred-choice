const json2csv = require('json-2-csv');
const fs = require('fs-extra');

const util = require('./util.js');

const Simulation = require('./simulation/Simulation.js');

require('log-timestamp');

/**
 * Generate a simulation configuration with the given number of interconnected
 * oracles, choices, and updates. Each choice will send a trigger attempt after
 * each triggerInterval updates.
 *
 * @param {number} oracles 
 * @param {number} choices 
 * @param {number} updates 
 * @param {number} triggerInterval 
 */
function generateConfig(oracles, choices, updates, triggerInterval) {
  const name = "o"  + oracles +
               "c"  + choices +
               "u"  + updates +
               "ti" + triggerInterval;

  const triggerCount = 2 + Math.ceil(updates / triggerInterval);
  const triggerTime = t => {
    let time = Math.min(t * triggerInterval, updates + 1);
    if (time == updates) {
      time++;
    }
    return time;
  };

  return {
    "name": name,
    "counts": {
      "o": oracles,
      "c": choices,
      "u": updates,
      "ti": triggerInterval
    },
    "choices": Array(choices).fill().map((_, c) => ({
      "name": "Choice" + c,
      "account": c,
      "events": Array(oracles).fill().map((_, o) => ({
        "type": "CONDITIONAL",
        "oracleName": "Oracle" + o,
        "operator": "GREATER_EQUAL",
        "value": updates
      })),
      "timeline": Array(triggerCount).fill().map((_, t) => ({
        "at": triggerTime(t), "context": { "target": 0 }
      }))
    })),
    "oracles": Array(oracles).fill().map((_, o) => ({
      "name": "Oracle" + o,
      "account": choices + o,
      "timeline": Array(updates).fill().map((_, u) => ({
        "at": u + 1,
        "context": {
          "value": u + 1
        }
      }))
    }))
  };
}

function generateConfigs(oracleSteps, choiceSteps, updateSteps, triggerInterval) {
  let configs = [];
  for (const oracles of oracleSteps) {
    for (const choices of choiceSteps) {
      for (const updates of updateSteps) {
        configs.push(generateConfig(oracles, choices, updates, triggerInterval));
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
  const scaling = 30;

  configs = generateConfigs(
    [1], // oracles
    [5,10,20], // choices
    [1,10,20,30], // updates
    5 // trigger interval
  );

  const start = Date.now();

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
  console.log('Started at:', start);
  console.log('Time now:', Date.now());

  const csv = await json2csv.json2csvAsync(outputs);
  await fs.outputFile('results_' + Date.now() + '.csv', csv);

  process.exit();
}

run();
