const seedrandom = require('seedrandom');
const json2csv = require('json-2-csv');
const fs = require('fs-extra');

const util = require('./util.js');

const Simulation = require('./simulation/Simulation.js');

const PastAsyncProvider = require('./providers/PastAsyncProvider.js');
const PastAsyncCondProvider = require('./providers/PastAsyncCondProvider.js');
const PastSyncProvider = require('./providers/PastSyncProvider.js');
const PastSyncCondProvider = require('./providers/PastSyncCondProvider.js');
const PresentAsyncProvider = require('./providers/PresentAsyncProvider.js');
const PresentSyncProvider = require('./providers/PresentSyncProvider.js');
const FutureAsyncProvider = require('./providers/FutureAsyncProvider.js');
const FutureAsyncCondProvider = require('./providers/FutureAsyncCondProvider.js');

var rng = seedrandom('oracle');

// [0,1,2,3,4,5,10,20,50]^2

// one oracle instance
// choices (consumers) x updates
// 1x1
// 1x10
// 1x100
// 1x1000
// 10x1
// 10x10
// 10x100
// 10x1000

function generateConfig(n, m) {
  // Timelines
  let oracleTimeline = Array(m).fill().map((_, i) => ({
    "at": i,
    "context": {
      "value": Math.floor(rng() * 100)
    }
  })) || [];
  let consumerTimeline = [
    { "at": 0 },
    { "at": m + 1, "context": { "target": 0 }}
  ]

  return {
    "name": n + "x" + m,
    "choices": Array(n).fill().map((_, i) => ({
      "name": "OracleConsumer" + i,
      "account": "Consumer",
      "events": [{
        "type": "CONDITIONAL",
        "oracleName": "Oracle",
        "operator": "GREATER",
        "value": 100
      }],
      "timeline": consumerTimeline
    })),
    "oracles": [
      {
        "name": "Oracle",
        "account": "Oracle",
        "timeline": oracleTimeline
      }
    ]
  };
}

async function run() {
  await util.init();

  let outputs = [];
  const scaling = 2;
  const providers = [
    PastAsyncProvider,
    PastAsyncCondProvider,
    PastSyncProvider,
    PastSyncCondProvider,
    PresentAsyncProvider,
    PresentSyncProvider,
    FutureAsyncProvider,
    FutureAsyncCondProvider,
  ];

  const steps = [0, 1, 2, 3, 4, 5, 10, 20, 50];
  for (let i = 0; i < steps.length; i++) {
    for (let j = 0; j < steps.length; j++) {
      const config = generateConfig(steps[i], steps[j]);
      for (provider of providers) {
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
