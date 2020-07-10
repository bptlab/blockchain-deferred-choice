const ChoiceConfig = require('./ChoiceConfig.js');
const OracleConfig = require('./OracleConfig.js');
const InstanceBatch = require('./InstanceBatch.js');
const Provider = require('./providers/FutureAsyncProvider.js');

const util = require('./util.js');

// Deploy an oracle
async function deployAndTest() {
  const c1 = new ChoiceConfig()
    .setAccount(util.getAccount('Consumer'))
    .setTimeline([
      { at:    0 }, // activation
      { at: 1000, target: 0 },
      { at: 2000, target: 1 }
    ])
    .addRelativeTimerEvent(60)
    .addConditionalEvent('WEATHER_WARNING', util.enums.Operator.EQUAL, 4)
    .addExplicitEvent();
  
  const o1 = new OracleConfig()
    .setName('WEATHER_WARNING')
    .setAccount(util.getAccount('Oracle'))
    .setTimeline([
      { at:    0, value:   5 },
      { at: 1000, value:   8 },
      { at: 2000, value: 100 },
      { at: 4000, value:   5 },
      { at: 5000, value:   4 }
    ])
    .setClass(Provider);
  
  const batch = new InstanceBatch([c1], [o1]);
  await batch.deploy();
  await batch.replay();
}

deployAndTest();

// web3.eth.getBalance("0xCfd7D177988076F99759c7814BC7f2603036C563", function(err, result) {
//   if (err) {
//     console.log(err)
//   } else {
//     console.log(web3.utils.fromWei(result, "ether") + " ETH")
//   }
// });
