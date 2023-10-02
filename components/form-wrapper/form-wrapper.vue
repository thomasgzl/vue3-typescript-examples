<template>
  <div
    :id="id"
    class="form-wrapper"
  >
    <form
      class="form-wrapper__form"
      novalidate
      @submit.prevent="save"
    >
      <slot />

      <div
        class="d-flex form-wrapper__form__tool-bar flex-wrap"
        :class="{ 'my-3': !confirmation }"
      >
        <template v-if="locked">
          <WarnProjectLocked />
        </template>
        <template v-else>
          <slot
            :display="!confirmation"
            name="tool-bar"
          >
            <span class="d-none" />
          </slot>
          <slot
            :disabled="saveLoading"
            :display="!confirmation"
            name="tool-bar-submit"
            :state="btnState"
          >
            <BtnMultiStates
              v-show="!confirmation"
              :id="`save-${id}-btn-submit`"
              :disabled="saveLoading"
              :state="btnState"
              type="submit"
            />
          </slot>
        </template>
      </div>

      <slot
        :disabled="saveLoading"
        :display="confirmation"
        name="confirmation"
        :state="btnState"
      >
        <div
          v-show="confirmation"
          class="alert alert-warning"
        >
          <ListErrors
            v-if="saveError"
            :alert-type="''"
            class="mb-2"
            :errors="saveError"
          />
          <div class="d-flex justify-content-end flex-wrap">
            <slot name="tool-bar-confirm">
              <button
                class="btn btn-weak btn-secondary btn-l"
                type="button"
                @click="clearErrors({ id })"
              >
                {{ $t('cancel') }}
              </button>
            </slot>
            <slot
              :disabled="saveLoading"
              :display="confirmation"
              name="tool-bar-confirm-submit"
              :state="btnState"
            >
              <BtnMultiStates
                :id="`save-${id}-btn-submit`"
                class="ms-2"
                :disabled="saveLoading"
                :state="btnState"
                type="submit"
              >
                <template #idle>
                  {{ $t(`confirm`) }}
                </template>
              </BtnMultiStates>
            </slot>
          </div>
        </div>
      </slot>

      <slot name="error">
        <div
          v-if="saveError && !confirmation"
          class="my-3 d-flex justify-content-end"
        >
          <ListErrors
            class="mb-0"
            :errors="saveError"
          />
        </div>
      </slot>
    </form>
  </div>
</template>

<script lang="ts" src="./form-wrapper.ts"></script>
<style scoped lang="scss" src="./form-wrapper.scss"></style>
