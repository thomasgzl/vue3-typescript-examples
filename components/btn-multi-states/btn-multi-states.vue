<template>
  <button
    ref="btn"
    :class="`${btnClasses} ${currentCssClass}`"
    :disabled="disabled || currentState !== BTN_MULTI_STATES.IDLE"
    :type="type"
    @click="
      $emit('click', $event);
      timeoutBlur();
    "
  >
    <transition name="fade">
      <div
        v-if="currentState === BTN_MULTI_STATES.IDLE"
        class="d-flex position-absolute justify-content-center align-items-center state"
      >
        <slot name="idle">
          <i
            aria-hidden="true"
            class="material-icons"
          >save_alt</i>
          <span>{{ $t('save') }}</span>
        </slot>
      </div>
    </transition>
    <transition name="fade">
      <div
        v-if="currentState === BTN_MULTI_STATES.LOADING"
        class="d-flex position-absolute justify-content-center align-items-center state"
      >
        <slot name="loading">
          <Spinner :alt="$t('loading')" />
        </slot>
      </div>
    </transition>
    <transition name="fade">
      <div
        v-if="currentState === BTN_MULTI_STATES.ERROR"
        class="d-flex position-absolute justify-content-center align-items-center state"
      >
        <slot name="error">
          <i
            aria-hidden="true"
            class="material-icons"
          >error</i>
          <span>{{ $t('error') }}</span>
        </slot>
      </div>
    </transition>
    <transition name="fade">
      <div
        v-if="currentState === BTN_MULTI_STATES.SUCCESS"
        class="d-flex position-absolute justify-content-center align-items-center state"
      >
        <slot name="success">
          <i
            aria-hidden="true"
            class="material-icons"
          >done</i>
          <span>{{ $t('success') }}</span>
        </slot>
      </div>
    </transition>
  </button>
</template>

<script lang="ts" src="./btn-multi-states.ts"></script>
<style scoped lang="scss" src="./btn-multi-states.scss"></style>
