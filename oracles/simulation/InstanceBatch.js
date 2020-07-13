const OracleInstance = require('./OracleInstance.js');
const ChoiceInstance = require('./ChoiceInstance.js');

class InstanceBatch {
  oracles = [];
  choices = [];

  constructor(choiceConfigs, oracleConfigs) {
    this.choiceConfigs = choiceConfigs;
    this.oracleConfigs = oracleConfigs;
  }

  async deploy() {
    // Deploy all oracles
    let oracleMap = {};
    for (let i = 0; i < this.oracleConfigs.length; i++) {
      const config = this.oracleConfigs[i];
      const instance = new OracleInstance(config);
      await instance.deploy();
      this.oracles.push(instance);
      oracleMap[config.name] = instance;
    }

    // Deploy all choices
    for (let i = 0; i < this.choiceConfigs.length; i++) {
      const config = this.choiceConfigs[i];
      const instance = new ChoiceInstance(config);
      await instance.deploy(oracleMap);
      this.choices.push(instance);
    }
  }

  async replay() {
    // Promise.all.replay...
  }
}

module.exports = InstanceBatch;