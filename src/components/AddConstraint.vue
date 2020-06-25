<template>
  <div class="md-layout-item">
    <md-field>
      <md-select v-model="type" name="type" id="type">
        <md-option value="absolute-timer">Absolute Timer</md-option>
        <md-option value="relative-timer">Relative Timer</md-option>
        <md-option value="conditional">Conditional Constraint</md-option>
        <md-option value="message">Message</md-option>
        <md-option value="signal">Signal</md-option>
      </md-select>
    </md-field>
  </div>
</template>

<script>
export default {
  name: 'constraint',
  data: () => ({
    type: 'message'
  })
}
</script>

<style lang="css">

</style>
