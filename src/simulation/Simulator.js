/**
 * A simulator gets a timeline of the form
 * ```
 * [
 *   { at: 1, context: {...} },
 *   ...
 * ]
 * ```
 * and replays the steps at the given timestamps.
 * Inheriting classes can then perform actions based on the context.
 */
class Simulator {
  constructor(timeline) {
    this.timeline = timeline;
  }

  /**
   * Perform the simulation.
   *
   * @param {number} scaling Timestep scaling in seconds
   */
  async simulate(scaling) {
    if (this.timeline.length == 0) {
      return;
    }

    // Initialize state of the simulation
    this.index = 0;
    this.start = Date.now();

    // Create a Promise that resolves once the simulation is over
    return new Promise(resolve => {
      const step = () => {
        this.onAction(this.index, this.timeline[this.index].context);
        this.index++;
        if (this.index < this.timeline.length) {
          // Wait for the exact amount of milliseconds to catch the next step
          const delay = this.timeline[this.index].at * 1000 * scaling - (Date.now() - this.start);
          setTimeout(step.bind(this), delay);
        } else {
          return resolve();
        }
      }
      // Wait for the first step
      setTimeout(step.bind(this), this.timeline[0].at * 1000 * scaling);
    });
  }

  /* virtual */ onAction(index, context) {
    // React to the simulation step
  }
}

module.exports = Simulator;
