const ChoiceConfig = require('./simulation/ChoiceConfig.js');
const OracleConfig = require('./simulation/OracleConfig.js');
const InstanceBatch = require('./simulation/InstanceBatch.js');
const Provider = require('./providers/FutureAsyncProvider.js');

const util = require('./util.js');

// Deploy an oracle
async function deployAndTest() {
  const c1 = new ChoiceConfig()
    .setAccount(util.getAccount('Consumer'))
    .addRelativeTimerEvent(60)
    .addConditionalEvent('WEATHER_WARNING', util.enums.Operator.EQUAL, 4)
    .addConditionalEvent('INTERRUPTION', util.enums.Operator.EQUAL, 1)
    .addExplicitEvent()
    .setTimeline([
      { at:     0 }, // activation
      { at:  1000, context: { target: 0 }},
      { at: 10000, context: { target: 1 }}
    ])
    .setExpectedWinner(2);
  
    const o1 = new OracleConfig()
    .setName('WEATHER_WARNING')
    .setAccount(util.getAccount('Oracle'))
    .setTimeline([
      { at:    0, context: { value:   5 }},
      { at: 1000, context: { value:   8 }},
      { at: 2000, context: { value: 100 }},
      { at: 4000, context: { value:   5 }},
      { at: 5000, context: { value:   4 }}
    ])
    .setClass(Provider);

  const o2 = new OracleConfig()
    .setName('INTERRUPTION')
    .setAccount(util.getAccount('Oracle2'))
    .setTimeline([
      { at:    0, context: { value: 0 }},
      { at: 2000, context: { value: 1 }},
      { at: 4000, context: { value: 0 }}
    ])
    .setClass(Provider);
  
  const batch = new InstanceBatch([c1], [o1, o2]);
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
