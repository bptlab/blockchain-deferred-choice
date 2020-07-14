const util = require('../util.js');

class OracleConfig {
  name;
  account;
  timeline;
  clazz;

  setName(name) {
    this.name = name;
    return this;
  }

  setAccountByName(name) {
    this.account = util.getAccount(name);
    return this;
  }

  setAccount(account) {
    this.account = account;
    return this;
  }

  setTimeline(timeline) {
    this.timeline = timeline;
    return this;
  }

  setClass(clazz) {
    this.clazz = clazz;
    return this;
  }
}

module.exports = OracleConfig;
