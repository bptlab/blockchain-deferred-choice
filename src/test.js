const InstanceBatch = require('./simulation/InstanceBatch.js');

const PastAsyncProvider = require('./providers/PastAsyncProvider.js');
const PastSyncProvider = require('./providers/PastSyncProvider.js');
const PresentAsyncProvider = require('./providers/PresentAsyncProvider.js');
const PresentSyncProvider = require('./providers/PresentSyncProvider.js');
const FutureAsyncProvider = require('./providers/FutureAsyncProvider.js');

// Deploy an oracle
async function deployAndTest() {
  let batch;
  let outputs = [];

  const c1 = require('./configs/choices/sample.json');
  const c2 = require('./configs/choices/timerWins.json');
  const o1 = require('./configs/oracles/weatherWarning.json');
  const o2 = require('./configs/oracles/interruption.json');

  batch = new InstanceBatch([c1, c2], [o1, o2], PastAsyncProvider);
  outputs.push(await batch.simulate());

  batch = new InstanceBatch([c1, c2], [o1, o2], PastSyncProvider);
  outputs.push(await batch.simulate());

  batch = new InstanceBatch([c1, c2], [o1, o2], PresentAsyncProvider);
  outputs.push(await batch.simulate());

  batch = new InstanceBatch([c1, c2], [o1, o2], PresentSyncProvider);
  outputs.push(await batch.simulate());

  batch = new InstanceBatch([c1, c2], [o1, o2], FutureAsyncProvider);
  outputs.push(await batch.simulate());

  console.log('FINAL RESULT');
  console.log(JSON.stringify(outputs, null, 2));
}

deployAndTest();

// web3.eth.getBalance("0xCfd7D177988076F99759c7814BC7f2603036C563", function(err, result) {
//   if (err) {
//     console.log(err)
//   } else {
//     console.log(web3.utils.fromWei(result, "ether") + " ETH")
//   }
// });
