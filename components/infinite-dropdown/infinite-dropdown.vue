<template>
  <TomSelect
    :id="id"
    :ref="`${id}`"
    v-model="localValue"
    class="form-control form-control-multiline"
    :filterable="false"
    :label="label"
    :loading="loading"
    :multiple="multiple"
    :options="items"
    :placeholder="$t('select.choose')"
    :selectable="(option) => option.active !== false"
    :teleport="teleport"
    @input="onInput"
    @input:focus="onFocus"
    @mounted="loadContainer"
  >
    <template #list-footer>
      <Suspense @resolve="ready = true">
        <Paginator
          :id="id"
          v-model:items="items"
          v-model:page="page"
          :additional-params="computedParams"
          :container="container"
          :url="route"
          @loading="loading = $event"
          @update:items="onUpdateItems"
          @update:total-items="
            total = $event;
            $emit('update:totalItems', $event);
          "
        />
      </Suspense>
    </template>
  </TomSelect>
</template>

<script lang="ts" src="./infinite-dropdown.ts"></script>
<style scoped lang="scss" src="./infinite-dropdown.scss"></style>
