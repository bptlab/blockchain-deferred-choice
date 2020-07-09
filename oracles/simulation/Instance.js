class Instance {
  contract;

  constructor(delay, events, timeline) {
    this.delay = delay;
    this.events = events;
    this.timeline = timeline;
  }

  async deploy(web3) {
    // deploy deferred choice
  }

  async replay(web3) {
    // wait for delay
    // activate contract
    // perform actions at specific time (trigger attempts)
  }
}

module.exports = Instance;
