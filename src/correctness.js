const json2csv = require('json-2-csv');
const fs = require('fs-extra');
const seedrandom = require('seedrandom');

const util = require('./util.js');

const Simulation = require('./simulation/Simulation.js');

require('log-timestamp');

let rng = seedrandom('Oracles');

function generateConfig(id, n) {
  // Base config
  let config = {
    name: 'Random' + id,
    n,
    choices: [{
      name: 'SomeChoice',
      account: 0,
      events: [],
      timeline: []
    }],
    oracles: []
  };

  // Generate events
  for (let i = 0; i < n; i++) {
    let event = {};
    const rnd = Math.floor(rng() * 3);
    if (rnd == 0) {
      event.type = 'TIMER';
      event.timer = i;
    } else if (rnd == 1) {
      let oracle = {
        name: 'Oracle' + i,
        account: i + 1,
        timeline: [
          { at: i, context: { value: 1 }}
        ]
      }
      config.oracles.push(oracle);

      event.type = 'CONDITIONAL';
      event.oracleName = 'Oracle' + i;
      event.operator = 'EQUAL';
      event.value = 1;
    } else if (rnd == 2) {
      event.type = 'EXPLICIT';
      config.choices[0].timeline.push({ at: i, context: { target: i }});
    }
    config.choices[0].events.push(event);
  }

  // Trigger attempt
  const target = Math.ceil(rng() * n);
  config.choices[0].timeline.push({ at: n, context: { target }});

  config.info = {
    n,
    target,
    targetType: config.choices[0].events[0].type,
    allTypes: config.choices[0].events.map(event => event.type).join(':')
  };

  return config;
}

async function run() {
  await util.init();

  let jsonBuffer = 'results_' + Date.now() + '.txt';
  let outputs = [];
  let configs = [];
  const scaling = 60;

  for (let i = 0; i < 2; i++) {
    configs.push(generateConfig(i, 5));
    // configs.push(generateConfig(i, 10));
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
      console.dir(config, {depth: null});
      console.log();

      const simulation = new Simulation(config, provider);
      const result = await simulation.perform(scaling);
      result.info = config.info;
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
