const util = require('../util.js');

class ChoiceConfig {
  account;
  timeline;
  winner;
  events = [];
  
  oracleNames = new Set();

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

  addAbsoluteTimerEvent(timer) {
    this.events.push({
      type: util.enums.EventDefinition.TIMER_ABSOLUTE,
      timer
    });
    return this;
  }

  addRelativeTimerEvent(timer) {
    this.events.push({
      type: util.enums.EventDefinition.TIMER_RELATIVE,
      timer
    });
    return this;
  }

  addConditionalEvent(oracleName, operator, value) {
    this.oracleNames.add(oracleName);
    this.events.push({
      type: util.enums.EventDefinition.CONDITIONAL,
      oracleName,
      operator,
      value
    });
    return this;
  }

  addExplicitEvent() {
    this.events.push({
      type: util.enums.EventDefinition.EXPLICIT
    });
    return this;
  }

  setExpectedWinner(winner) {
    this.winner = winner;
    return this;
  }

  convertToEthereum(oracleAddresses) {
    return this.events.map(event => [
      event.type,
      // For absolute timers, we regard the given timer value as an offset
      // to the current timestamp. Otherwise, configs would be rather static
      event.type == util.enums.EventDefinition.TIMER_ABSOLUTE
                  ? event.timer + Math.ceil(Date.now() / 1000)
                  : (event.timer || 0),
      event.oracleName ? oracleAddresses[event.oracleName] :
                         '0x0000000000000000000000000000000000000000',
      [
        event.operator || 0,
        event.value || 0
      ]
    ]);
  }
}

module.exports = ChoiceConfig;
