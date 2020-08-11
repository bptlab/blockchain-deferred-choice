const json2csv = require('json-2-csv');
const fs = require('fs-extra');

const util = require('./util.js');

const InstanceBatch = require('./simulation/InstanceBatch.js');

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

  let batch;
  let outputs = [];

  const c0 = require('./configs/choices/sample.json');
  const c1 = require('./configs/choices/timerWins.json');
  const o0 = require('./configs/oracles/weatherWarning.json');
  const o1 = require('./configs/oracles/interruption.json');
  const choices = [c0, c1];
  const oracles = [o0, o1];
  const scaling = 4;

  const providers = [
    PastAsyncCondProvider,
    PastSyncCondProvider,
    FutureAsyncCondProvider
  ];

  for (provider of providers) {
    batch = new InstanceBatch(choices, oracles, provider);
    outputs.push(await batch.simulate(scaling));
  }

  console.log('FINAL RESULT');
  console.log(JSON.stringify(outputs, null, 2));

  const csv = await json2csv.json2csvAsync(outputs);
  await fs.outputFile('results.csv', csv);

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
