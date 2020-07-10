const util = require('./util.js');

// Deploy an oracle
async function deployAndTest() {
  const spec = util.getSpec('BaseDeferredChoice');
  const contract = new util.web3.eth.Contract(spec.abi, undefined, {
    from: util.getAcc('Oracle'),
    ...util.defaultOptions,
    data: spec.evm.bytecode.object
  });

  const instance = await contract.deploy({
    arguments: [[
      [
        util.enums.EventDefinition.TIMER_RELATIVE,
        600,
        '0x0000000000000000000000000000000000000000',
        [
          0,
          0
        ]
      ],
      [
        util.enums.EventDefinition.CONDITIONAL,
        0,
        '0x6Fd16C314159D1173069EcEC535c6Cd3c2369BAB',
        [
          util.enums.Operator.GREATER_EQUAL,
          50
        ]
      ],
      [
        util.enums.EventDefinition.EXPLICIT,
        0,
        '0x0000000000000000000000000000000000000000',
        [
          0,
          0
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
