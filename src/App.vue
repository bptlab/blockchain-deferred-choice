<template>
  <div id="app">
    <h1>{{ msg }}</h1>
    <constraint></constraint>
  </div>
</template>

<script>
import Constraint from './components/Constraint.vue';

export default {
  name: 'app',
  components: {
    Constraint
  },
  data () {
    return {
      msg: 'Welcome to Your Vue.js App!'
    }
  }
}
</script>

<style lang="css">
  #app {
    color: #56b983;
  }
</style>
