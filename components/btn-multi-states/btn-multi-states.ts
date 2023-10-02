import { overrideBtnCssClass } from '@/utils/override-css';
import { defineComponent, defineAsyncComponent, PropType } from 'vue';
import { BTN_MULTI_STATES } from '@/const';

/* c8 ignore next */
const Spinner = defineAsyncComponent(() => import('@/components/spinner/spinner.vue'));

export default defineComponent({
  name: 'BtnMultiStates',
  components: { Spinner },
  props: {
    cssClass: {
      type: String,
      default: 'btn-primary'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    state: {
      type: String as PropType<BTN_MULTI_STATES>,
      default: BTN_MULTI_STATES.IDLE, // idle | loading | error | success
      required: true
    },
    type: {
      type: String as PropType<'submit' | 'button'>,
      default: 'button' // submit | button
    },
    btnClassOverride: {
      type: String,
      default: ''
    },
    fixedWidth: {
      type: Boolean,
      default: true
    }
  },
  emits: ['click'],
  data() {
    return {
      BTN_MULTI_STATES: BTN_MULTI_STATES,
      currentState: BTN_MULTI_STATES.IDLE,
      timerAutoIdle: -1,
      timerBlur: -1,
      TIME_AUTO: 2000,
      currentCssClass: this.cssClass
    };
  },
  computed: {
    btnClasses(): string {
      return overrideBtnCssClass(`btn btn-l btn-strong position-relative btn-multi-states${this.fixedWidth ? ' btn-fw' : ''}`, this.btnClassOverride);
    }
  },
  watch: {
    state: function(newState) {
      this.update(newState);
    }
  },
  methods: {
    timeoutBlur: function() {
      clearTimeout(this.timerBlur);
      /* c8 ignore next */
      this.timerBlur = window.setTimeout(() => {
        if (this.$refs.btn) {
          (this.$refs.btn as HTMLElement).blur();
        }
      }, 500);
    },
    update: function(newState: BTN_MULTI_STATES) {
      clearTimeout(this.timerAutoIdle);
      this.currentState = newState;
      this.timeoutBlur();
      switch (newState) {
        case BTN_MULTI_STATES.SUCCESS: {
          this.currentCssClass = 'btn-success';
          this.timerAutoIdle = window.setTimeout(() => {
            this.currentState = BTN_MULTI_STATES.IDLE;
            this.currentCssClass = this.cssClass;
          }, this.TIME_AUTO);
          break;
        }
        case BTN_MULTI_STATES.ERROR: {
          this.currentCssClass = 'btn-danger';
          this.timerAutoIdle = window.setTimeout(() => {
            this.currentState = BTN_MULTI_STATES.IDLE;
            this.currentCssClass = this.cssClass;
          }, this.TIME_AUTO);
          break;
        }
      }
    }
  }
});
