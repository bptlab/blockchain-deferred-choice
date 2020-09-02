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

// Deploy an oracle
async function deployAndTest() {
  await util.init();

  let outputs = [];

  const config = require('./configs/simulations/1.json');
  const scaling = 4;

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

  for (provider of providers) {
    const simulation = new Simulation(config, provider);
    outputs.push(await simulation.perform(scaling));
  }

  console.log('FINAL RESULT');
  console.log(JSON.stringify(outputs, null, 2));

  const csv = await json2csv.json2csvAsync(outputs);
  await fs.outputFile('results_' + Date.now() + '.csv', csv);

  process.exit();
}

deployAndTest();

// web3.eth.getBalance("0xCfd7D177988076F99759c7814BC7f2603036C563", function(err, result) {
//   if (err) {
//     console.log(err)
//   } else {
//     console.log(web3.utils.fromWei(result, "ether") + " ETH")
//   }
// });
