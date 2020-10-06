const seedrandom = require('seedrandom');
const json2csv = require('json-2-csv');
const fs = require('fs-extra');

const util = require('./util.js');

const Simulation = require('./simulation/Simulation.js');

var rng = seedrandom('oracle');

const et = 0;
const ew = 1;
const ed = 2;
const ec = 3;

function generateConfig(info, target, first = [], second = []) {
  // activate
  // implicit events A occur
  // implicit events B occur
  // trigger target if implicit

  let config = {
    name: info + '_' + target + '_' + first.join(':') + '_' + second.join(':'),
    choices: [{
      name: 'RunningExample',
      account: 0,
      events: [{
        // (0) e_t, train departed
        type: 'EXPLICIT'
      }, {
        // (1) e_w, severe weather warning issued
        type: 'CONDITIONAL',
        oracleName: 'WeatherWarning',
        operator: 'GREATER_EQUAL',
        value: 2
      }, {
        // (2) e_d, discount card expired
        type: 'TIMER',
        timer: 10
      },  {
        // (3) e_c, ticket cancelled
        type: 'EXPLICIT'
      }],
      timeline: [
        { at: 0, context: { target: ew }}
      ]
    }],
    oracles: [{
      name: 'WeatherWarning',
      account: 1,
      timeline: [
        { at: 0, context: { value: 0 }}
      ]
    }]
  };

  // Implicit timer event
  if (first.includes(ed)) {
    config.choices[0].events[ed].timer = 1;
  } else if (second.includes(ed)) {
    config.choices[0].events[ed].timer = 2;
  }

  // Implicit conditional event
  if (first.includes(ew)) {
    config.oracles[0].timeline.push({
      at: 1, context: { value: 3 }
    });
  } else if (second.includes(ew)) {
    config.oracles[0].timeline.push({
      at: 2, context: { value: 3 }
    });
  }

  // Explicit events
  if (first.includes(et)) {
    config.choices[0].timeline.push({
      at: 1, context: { target: et }
    });
  } else if (second.includes(et)) {
    config.choices[0].timeline.push({
      at: 2, context: { target: et }
    });
  }
  if (first.includes(ec)) {
    config.choices[0].timeline.push({
      at: 1, context: { target: ec }
    });
  } else if (second.includes(ec)) {
    config.choices[0].timeline.push({
      at: 2, context: { target: ec }
    });
  }

  // If implicit then trigger afterwards
  if (target == ed || target == ew) {
    let at = 1 + (first.length == 0 ? 1 : 0) + (second.length == 0 ? 1 : 0);
    config.choices[0].timeline.push({
      at, context: { target: target }
    });
  }

  return config;
}

async function run() {
  await util.init();

  let jsonBuffer = 'results_' + Date.now() + '.txt';
  let outputs = [];
  let configs = [];
  const scaling = 10;

  const all = [et, ew, ed, ec];
  for (const e of all) {
    const others = all.slice();
    others.splice(e, 1);

    configs.push(generateConfig('(1)', e, [e]));
    configs.push(generateConfig('(2)', e, [e], others));
    configs.push(generateConfig('(3)', e, others, [e]));
  }

  const start = Date.now();

  for (const [i, config] of configs.entries()) {
    for (const [j, provider] of util.getProviders().entries()) {
      console.log();
      console.log();
      console.log('Starting config', i + 1, '/', configs.length);
      console.log('Using provider', j + 1, '/', util.getProviders().length, provider.getContractPrefix());
      console.log('Name:', config.name);
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
