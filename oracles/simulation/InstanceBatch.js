/**
 * Instance specifications
 * Oracle specifications
 * 
 * => deploy oracles in all impls
 * => deploy instances for each oracle impl
 */
class InstanceBatch {
  oracles = {};

  constructor(instanceSpecs, oracleSpecs) {
    this.instanceSpecs = instanceSpecs;
    this.oracleSpecs = oracleSpecs;
  }

  async deploy(web3) {
    // deploy oracles
    // deploy instances with linked oracles
  }

  async replay(web3) {
    // start instances (with delay)
    // start oracles (with delay)
  }

}

module.exports = InstanceBatch;
