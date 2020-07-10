const vorpal = require('vorpal')();

const util = require('./util.js');
const Provider = require('./providers/FutureAsyncProvider.js');

let provider;

vorpal
  .command('deploy', 'Deploy a new set of oracles.')
  .action(() => {
    provider = new Provider(
      'TestOracle',
      util.getAcc('Oracle'),
      [
        { at:    0, value:   5 },
        { at: 1000, value:   8 },
        { at: 2000, value: 100 },
        { at: 4000, value:   5 },
        { at: 5000, value:   4 }
      ]
    );
    return provider.deploy();
  });

vorpal
  .command('replay', 'Start replay of last deployed oracles.')
  .action(() => {
    return provider.replay();
  });

vorpal
  .delimiter('oracles$')
  .show();

// deploy an oracle
// async function deployAndTest() {
//   const someOracle = new RequestResponseOracle(
//     'TestOracle',
//     [
//       { at:    0, value:  5 },
//       { at: 1000, value:  8 },
//       { at: 2000, value: 10 },
//       { at: 4000, value:  5 },
//       { at: 5000, value:  4 }
//     ]
//   );
//   await someOracle.deploy();
//   someOracle.startReplay();
// }

// deployAndTest();



// deployed.methods.getValue(
//   42
// ).send({
//   from: deferredAdd,
//   gas: 200000,
//   gasPrice: web3.utils.toWei('1', 'gwei')
// }).on('transactionHash', (hash) => {
//   console.log('Hash', hash);
// }).on('receipt', (receipt) => {
//   console.log('Receipt', receipt);
// }).on('error', console.error);

// web3.eth.sendTransaction({
//   from: oraclesAdd,
//   value: web3.utils.toWei('1', 'ether'),
//   gas: 21000
// }).on('transactionHash', (hash) => {
//   console.log('Hash', hash);
// }).on('receipt', (receipt) => {
//   console.log('Receipt', receipt);
// }).on('error', console.error);

// web3.eth.getBalance("0xCfd7D177988076F99759c7814BC7f2603036C563", function(err, result) {
//   if (err) {
//     console.log(err)
//   } else {
//     console.log(web3.utils.fromWei(result, "ether") + " ETH")
//   }
// });

// web3.eth.sendTransaction({
//   from: deferredAdd,
//   to: oraclesAdd,
//   value: web3.utils.toWei('1', 'ether'),
//   gas: 21000
// }).on('transactionHash', (hash) => {
//   console.log('Hash', hash);
// }).on('receipt', (receipt) => {
//   console.log('Receipt', receipt);
// }).on('error', console.error);
