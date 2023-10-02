import { defineComponent, defineAsyncComponent, PropType } from 'vue';
import http from '@/http';
import EventBus from '@/event-bus';
import { animateCSS } from '@/utils/animate';
import { Validation } from '@vuelidate/core';
import { FORM_WRAPPER_EVENTS, FORM_WRAPPER_EVENTS_TYPES, BTN_MULTI_STATES } from '@/const';

const ListErrors = defineAsyncComponent(() => import('@/components/list-errors/list-errors.vue'));
const BtnMultiStates = defineAsyncComponent(() => import('@/components/btn-multi-states/btn-multi-states.vue'));
const WarnProjectLocked = defineAsyncComponent(() => import('@/components/warn-project-locked/warn-project-locked.vue'));

interface IData {
  saveError: unknown;
  saveLoading: boolean;
  btnState: BTN_MULTI_STATES;
  observer: MutationObserver | null;
  confirmation: boolean;
}

interface IFormWrapperEventOptions {
  bypassLock?: boolean;
  bypassValidation?: boolean;
  params?: unknown;
}

export interface IRouteSave {
  id?: string;
  apiSave: string;
  postData: (context?: Record<string, any>) => any;
  httpMethod?: 'get' | 'post' | 'delete' | 'put' | 'patch';
}

export interface IFormWrapperEvent {
  id: string;
  data?: unknown;
  state?: FORM_WRAPPER_EVENTS_TYPES;
  options?: IFormWrapperEventOptions;
}

export default defineComponent({
  name: 'FormWrapper',
  components: { BtnMultiStates, ListErrors, WarnProjectLocked },
  props: {
    id: { type: String, required: true },
    vuelidate: { type: Object as PropType<Validation>, default: null },
    invalid: { type: Boolean, default: false },
    routesSave: {
      type: Array as PropType<IRouteSave[]>,
      required: true,
      validator: (value: IRouteSave[]): boolean => {
        return value.every((route) => {
          return (
            typeof route.apiSave === 'string'
            && typeof route.postData === 'function'
            && (!route.httpMethod || ['get', 'post', 'delete', 'put', 'patch'].includes(route.httpMethod))
            && (!route.id || typeof route.id === 'string')
          );
        });
      }
    },
    onUploadProgress: {
      type: Function,
      /* c8 ignore next 3 */
      default: () => {
        /* empty */
      }
    },
    locked: { type: Boolean, default: false },
    autoLockChild: { type: Boolean, default: true }
  },
  emits: [FORM_WRAPPER_EVENTS_TYPES.LOADING, FORM_WRAPPER_EVENTS_TYPES.SUBMITTED, FORM_WRAPPER_EVENTS_TYPES.ERROR, FORM_WRAPPER_EVENTS_TYPES.INVALID],
  data() {
    return {
      /* save data */
      saveError: null,
      saveLoading: false,
      btnState: BTN_MULTI_STATES.IDLE,
      observer: null,
      confirmation: false
    } as IData;
  },
  computed: {},
  watch: {
    locked: function(newValue): void {
      if (newValue) {
        this.setLock();
      } else {
        this.unLock();
      }
    }
  },
  created: function() {
    EventBus.$on(FORM_WRAPPER_EVENTS.SUBMIT, this.forceSubmit);
    EventBus.$on(FORM_WRAPPER_EVENTS.CLEAR_ERRORS, this.clearErrors);
  },
  beforeUnmount: function() {
    EventBus.$off(FORM_WRAPPER_EVENTS.SUBMIT, this.forceSubmit);
    EventBus.$off(FORM_WRAPPER_EVENTS.CLEAR_ERRORS, this.clearErrors);
    if (this.observer) {
      this.observer.disconnect();
    }
  },
  mounted: function() {
    if (this.locked) {
      this.setLock();
    }
  },
  methods: {
    clearErrors(e: IFormWrapperEvent) {
      if (e.id === this.id) {
        this.saveError = null;
        this.confirmation = false;
      }
    },
    async forceSubmit(e: IFormWrapperEvent) {
      if (e.id === this.id) {
        await this.save(e.options);
      }
    },
    async save(options: IFormWrapperEventOptions = { bypassLock: false, bypassValidation: false, params: {} }) {
      /* c8 ignore next */
      if (this.locked && !options.bypassLock) {
        return;
      }
      if (!options.bypassValidation) {
        const invalid = this.vuelidate?.$invalid;
        if (invalid) {
          this.vuelidate.$touch();
        }
        if (invalid || this.invalid) {
          const btns: HTMLElement[] = this.$el.querySelectorAll('.form-wrapper__form__tool-bar button[type=submit]');
          btns.forEach((btn) => {
            animateCSS(btn, 'shake');
          });
          this.$emit(FORM_WRAPPER_EVENTS_TYPES.INVALID);
          EventBus.$emit(FORM_WRAPPER_EVENTS.UPDATE, { id: this.id, state: FORM_WRAPPER_EVENTS_TYPES.INVALID });
          return;
        }
      }
      this.btnState = BTN_MULTI_STATES.LOADING;
      this.saveLoading = true;
      if (!this.confirmation) this.saveError = null; // Let error displayed if confirmation mode until end of request
      this.$emit(FORM_WRAPPER_EVENTS_TYPES.LOADING);
      EventBus.$emit(FORM_WRAPPER_EVENTS.UPDATE, { id: this.id, state: FORM_WRAPPER_EVENTS_TYPES.LOADING });
      const results: Record<string, any> = {}; // Store every route result
      let currentRoute: null | IRouteSave = null; // Store current route calling in case of error catching
      try {
        for (const route of this.routesSave) {
          currentRoute = route;
          let url = new URL(`${import.meta.env.VITE_API_URL}${route.apiSave}`);
          if (route.apiSave.substring(0, 4) === 'http') {
            url = new URL(route.apiSave);
          }
          if (this.confirmation && !url.searchParams.has('force')) {
            url.searchParams.set('force', 'true');
          }
          const data = await route.postData(results);
          const res = await http(url.toString(), {
            method: route.httpMethod || 'post',
            data,
            params: options.params,
            onUploadProgress: this.onUploadProgress as (progressEvent: unknown) => void
          });
          results[route.id || route.apiSave] = res.data;
        }
        this.btnState = BTN_MULTI_STATES.SUCCESS;
        this.confirmation = false;
        this.saveError = null;
        this.$emit(FORM_WRAPPER_EVENTS_TYPES.SUBMITTED, results);
        EventBus.$emit(FORM_WRAPPER_EVENTS.UPDATE, { id: this.id, state: FORM_WRAPPER_EVENTS_TYPES.SUCCESS, data: results });
      } catch (error: any) {
        console.error(error);
        /* c8 ignore next (to remove when optional chaining can easily be tested) */
        if (error?.response?.status === 449) {
          this.confirmation = true;
          this.btnState = BTN_MULTI_STATES.IDLE;
        } else {
          this.confirmation = false;
          this.btnState = BTN_MULTI_STATES.ERROR;
        }
        this.saveError = {
          ...error,
          routeId: currentRoute?.id || currentRoute?.apiSave,
          successfulRoutes: results
        };
        this.$emit(FORM_WRAPPER_EVENTS_TYPES.ERROR, this.saveError);
        EventBus.$emit(FORM_WRAPPER_EVENTS.UPDATE, { id: this.id, state: FORM_WRAPPER_EVENTS_TYPES.ERROR, data: this.saveError });
      } finally {
        this.saveLoading = false;
      }
    },
    setLock() {
      if (this.autoLockChild === false) return;
      const config = { subtree: true, childList: true };
      const dom = this.$el;
      function onMutations() {
        const elements: HTMLElement[] = dom.querySelectorAll('input,select,textarea,button,.tselect');
        elements.forEach((el) => {
          if (el.hasAttribute('data-locked-enable') === false) {
            el.setAttribute('disabled', 'disabled');
          }
          if (el.hasAttribute('data-locked-visible') === false) {
            if (el.tagName === 'BUTTON' && !el.classList.contains('se-tooltip')) {
              el.style.display = 'none';
            }
          }
        });
      }
      /* c8 ignore next 3 */
      if (this.observer) {
        this.observer.disconnect();
      }
      onMutations();
      this.observer = new MutationObserver(onMutations);
      this.observer.observe(dom, config);
    },
    unLock() {
      if (this.autoLockChild === false) return;
      // Attention, risque de déverouillage d'éléments vérrouillés de manières différentes !!
      /* c8 ignore next */
      if (this.observer) {
        this.observer.disconnect();
      }
      const dom = this.$el;
      const elements: HTMLElement[] = dom.querySelectorAll('input,select,textarea,button,.tselect');
      elements.forEach((el) => {
        if (el.hasAttribute('data-unlock-ignore') === false) {
          el.removeAttribute('disabled');
        }
        if (el.tagName === 'BUTTON') {
          el.style.display = '';
        }
      });
    }
  }
});
