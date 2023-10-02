<template>
  <template
    v-for="item of items"
    :key="item[keyLoop]"
  >
    <slot :item="item" />
  </template>
  <slot
    :loading="loading"
    name="loading"
  >
    <Spinner
      v-if="loading"
      class="mx-auto my-3"
    />
  </slot>
</template>

<script lang="ts" src="./paginator.ts"></script>
<style scoped lang="scss" src="./paginator.scss"></style>
