<template>
  <div
    :id="id"
    class="getter-wrapper"
  >
    <ListErrors
      v-if="loadError"
      :errors="loadError"
    />
    <Spinner
      v-else-if="loadLoading && loadType === GETTER_WRAPPER_LOAD_TYPES.FULL"
      class="spinner"
    />
    <div
      v-else
      class="slot"
      :class="{ 'partial-reload': loadLoading && loadType === GETTER_WRAPPER_LOAD_TYPES.PARTIAL }"
    >
      <slot />
    </div>
  </div>
</template>

<script lang="ts" src="./getter-wrapper.ts"></script>
<style scoped lang="scss" src="./getter-wrapper.scss"></style>
