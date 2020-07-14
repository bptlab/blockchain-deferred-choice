class Replayer {
  constructor(timeline) {
    this.timeline = timeline;
  }

  async replay() {
    this.index = 0;
    this.start = Date.now();

    return new Promise(resolve => {
      const step = () => {
        this.onReplayStep(this.index, this.timeline[this.index].context);
        this.index++;
        if (this.index < this.timeline.length) {
          const delay = this.timeline[this.index].at - (Date.now() - this.start);
          setTimeout(step.bind(this), delay);
        } else {
          return resolve();
        }
      }
      setTimeout(step.bind(this), this.timeline[0].at);
    });
  }

  onReplayStep(index, context) {
    // React to the replay step
  }
}

module.exports = Replayer;
