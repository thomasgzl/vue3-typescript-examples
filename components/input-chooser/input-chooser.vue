<template>
  <div class="input-chooser">
    <div
      :id="id"
      :class="`axis-${axis}`"
    >
      <div
        v-for="item of options"
        :key="item.id"
        class="form-check m-0 p-0 d-flex me-3 mb-2"
      >
        <input
          :id="item.uuid"
          v-model="valueInput"
          class="form-check-input m-0 me-1 flex-shrink-0 flex-grow-0"
          :disabled="disabled || item.disabled"
          :name="id"
          :required="required"
          :type="type"
          :value="item.id"
          @click="onClickItem"
        >
        <slot :item="item">
          <label
            class="form-check-label m-0"
            :class="item.class ? item.class : ''"
            :for="item.uuid"
          >
            <span
              class="d-flex align-items-center"
              v-html="item.value"
            />
          </label>
        </slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./input-chooser.ts"></script>
<style scoped lang="scss" src="./input-chooser.scss"></style>
