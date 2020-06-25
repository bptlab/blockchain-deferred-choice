<template>
  <div class="md-layout">
    <div class="md-layout-item">
      <md-avatar class="md-avatar-icon">
        <md-icon>storage</md-icon>
      </md-avatar>
      <md-field>
        <label>Constraint</label>
        <md-input v-model="specification"></md-input>
      </md-field>
    </div>
  </div>
</template>

<script>
export default {
  name: 'constraint',
  data: () => ({
    type: 'message',
    specification: '',
  })
}
</script>

<style lang="css">

</style>
