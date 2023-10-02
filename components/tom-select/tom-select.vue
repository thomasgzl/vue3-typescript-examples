<template>
  <div
    ref="root-dom"
    class="tselect"
    :class="{ focused, disabled, multiple, single: !multiple }"
    :disabled="disabled || null"
  >
    <div
      :id="`reference-${uuid}`"
      :aria-expanded="focused"
      aria-haspopup="listbox"
      :aria-owns="`popper-${uuid}`"
      class="tselect__container"
      :class="{ 'tselect--close': !focused }"
      role="combobox"
      @click="focusInput"
    >
      <template
        v-for="(opt, index) of selectedOptions"
        :key="`tselect-selected-options-${uuid}-${index}`"
      >
        <slot
          name="selected-option-container"
          v-bind="opt"
        >
          <span
            class="tselect__selected-option"
            :class="{ 'badge badge-primary': multiple }"
          >
            <slot
              name="selected-option"
              v-bind="opt"
            >
              <div
                v-tooltip
                class="text-overflow"
                :data-tooltip-content="opt[label]"
              >
                {{ opt[label] }}
              </div>
            </slot>

            <button
              v-if="multiple"
              class="tselect__selected-option-remove btn btn-strong btn-primary btn-icon"
              :title="$t('delete')"
              type="button"
              @click.stop="toggleOption(opt)"
            >
              &#x2715;
            </button>
          </span>
        </slot>
      </template>
      <input
        :id="id"
        ref="input"
        v-model.trim="typedText"
        :aria-activedescendant="focused ? activedescendant : null"
        aria-autocomplete="list"
        :aria-controls="`popper-${uuid}`"
        :aria-labelledby="ariaLabelledby || null"
        autocomplete="off"
        class="tselect__input p-0"
        :disabled="disabled"
        :placeholder="displayedPlaceholder"
        type="search"
        @focus="gainFocus()"
        @input="$emit('input', typedText)"
        @keydown="handleKey"
        @keydown.esc.stop.prevent="loseFocus()"
      >
    </div>
    <Teleport :to="teleport">
      <ul
        v-show="focused"
        :id="`popper-${uuid}`"
        ref="display-options"
        :aria-activedescendant="activedescendant"
        class="tselect__display-options"
        role="listbox"
        tabindex="0"
      >
        <li
          v-for="(opt, index) of displayOptions"
          :id="`tselect-option-${uuid}-${index}`"
          :key="`${JSON.stringify(reduce(opt))}-${index}`"
          :aria-disabled="!selectable(opt)"
          :aria-selected="selectedOptions.some((o) => JSON.stringify(reduce(o)) === JSON.stringify(reduce(opt)))"
          class="tselect__display-option p-2"
          :class="{ hover: activedescendant === JSON.stringify(reduce(opt)) }"
          role="option"
          @click.stop.prevent="toggleOption(opt, true)"
          @keydown.stop.prevent="toggleOption(opt, true)"
          @mouseover="activedescendant = JSON.stringify(reduce(opt))"
        >
          <slot
            name="option"
            v-bind="opt"
          >
            <div
              v-tooltip
              class="text-overflow"
            >
              {{ opt[label] }}
            </div>
          </slot>
        </li>
        <li v-if="displayNoData && focused && loading === false">
          <slot name="no-options">
            <div class="p-2">
              {{ $t('noData') }}
            </div>
          </slot>
        </li>
        <slot name="list-footer" />
      </ul>
    </Teleport>
  </div>
</template>

<script lang="ts" src="./tom-select.ts"></script>
<style scoped lang="scss" src="./tom-select.scss"></style>
