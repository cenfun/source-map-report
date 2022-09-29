<template>
  <div
    v-if="props.rowData"
    class="vui-detail"
  >
    <div class="vui-modal-block">
      <div class="vui-modal-label">
        {{ props.rowData.name }}
      </div>
    </div>
    <div>
      <pre><code>{{ props.rowData.codes }}</code></pre>
    </div>
  </div>
</template>

<script setup>

const props = defineProps({
    rowData: {
        type: Object,
        default: null
    }
});

</script>

<style lang="scss">
.vui-detail {
    width: 100%;
    height: 100%;
    overflow: auto;
}
</style>

