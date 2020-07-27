const json2csv = require('json-2-csv');
const fs = require('fs-extra');

const util = require('./util.js');

const InstanceBatch = require('./simulation/InstanceBatch.js');

const PastAsyncProvider = require('./providers/PastAsyncProvider.js');
const PastSyncProvider = require('./providers/PastSyncProvider.js');
const PresentAsyncProvider = require('./providers/PresentAsyncProvider.js');
const PresentSyncProvider = require('./providers/PresentSyncProvider.js');
const FutureAsyncProvider = require('./providers/FutureAsyncProvider.js');

// Deploy an oracle
async function deployAndTest() {
  await util.init();

  let batch;
  let outputs = [];

  const c0 = require('./configs/choices/sample.json');
  const c1 = require('./configs/choices/timerWins.json');
  const o0 = require('./configs/oracles/weatherWarning.json');
  const o1 = require('./configs/oracles/interruption.json');
  const choices = [c0 ]; //, c1]; //[c0, c1];
  const oracles = [o0, o1];
  const scaling = 4;

  batch = new InstanceBatch(choices, oracles, PastAsyncProvider);
  outputs.push(await batch.simulate(scaling));

  batch = new InstanceBatch(choices, oracles, PastSyncProvider);
  outputs.push(await batch.simulate(scaling));

  batch = new InstanceBatch(choices, oracles, PresentAsyncProvider);
  outputs.push(await batch.simulate(scaling));

  batch = new InstanceBatch(choices, oracles, PresentSyncProvider);
  outputs.push(await batch.simulate(scaling));

  batch = new InstanceBatch(choices, oracles, FutureAsyncProvider);
  outputs.push(await batch.simulate(scaling));

  console.log('FINAL RESULT');
  console.log(JSON.stringify(outputs, null, 2));

  const csv = await json2csv.json2csvAsync(outputs);
  await fs.outputFile('results.csv', csv);
}

deployAndTest();

// web3.eth.getBalance("0xCfd7D177988076F99759c7814BC7f2603036C563", function(err, result) {
//   if (err) {
//     console.log(err)
//   } else {
//     console.log(web3.utils.fromWei(result, "ether") + " ETH")
//   }
// });
