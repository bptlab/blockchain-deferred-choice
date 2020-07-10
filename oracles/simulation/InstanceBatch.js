/**
 * Instance specifications
 * Oracle specifications
 * 
 * => deploy oracles in all impls
 * => deploy instances for each oracle impl
 */
class InstanceBatch {
  oracles = {};

  constructor(specNames) {
  }

  async deploy() {
    // deploy oracles
    // deploy instances with linked oracles
  }

  async replay() {
    // start instances (with delay)
    // start oracles (with delay)
  }

}

module.exports = InstanceBatch;
