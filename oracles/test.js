const Web3 = require('web3');

const util = require('./util.js');

// Connect to blockchain and prepare environment
const web3 = new Web3(new Web3.providers.WebsocketProvider(
  //'wss://ropsten.infura.io/ws/v3/ac8b7480996843d18ee89a61c6d0d673'
  'ws://localhost:8545'
));
const account = util.registerPrivateKey(web3, './keys/deferred.ppk');
const specs = util.compileContracts('Interfaces.sol', 'DeferredChoice.sol');

// Deploy an oracle
async function deployAndTest() {
  const contract = new web3.eth.Contract(specs.BaseDeferredChoice.abi, undefined, {
    from: account,
    ...util.defaultOptions,
    data: specs.BaseDeferredChoice.evm.bytecode.object
  });

  const instance = await contract.deploy({
    arguments: [[
      [
        util.enums.EventDefinition.TIMER_RELATIVE,
        100,
        '0x0000000000000000000000000000000000000000',
        [
          0,
          0
        ]
      ],
      [
        util.enums.EventDefinition.CONDITIONAL,
        0,
        '0x03EB3549788426c2bA1ff8E44a147Aa1d16f3363',
        [
          util.enums.Operator.EQUAL,
          4
        ]
      ]
    ]]
  }).send().on('transactionHash', hash => {
    console.log(this.name, 'HASH', hash);
  }).on('receipt', receipt => {
    console.log(this.name, 'RECEIPT', receipt.contractAddress);
  }).on('error', error => {
    console.error(this.name, 'ERROR', error);
  })

  instance.events.allEvents({
    fromBlock: 'latest'
  }).on('data', data => {
    console.log(this.name, 'EVENT', data.event, data.returnValues);
  }).on('error', error => {
    console.error(this.name, 'ERROR', error);
  });
}

deployAndTest();
