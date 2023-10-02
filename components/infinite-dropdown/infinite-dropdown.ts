import { defineComponent, defineAsyncComponent, PropType } from 'vue';
import { v4 as uuid } from 'uuid';
import { PAGINATOR_EVENTS, INFINITE_DROPDOWN_EVENTS } from '@/const';
import EventBus from '@/event-bus';
import { PModelValue } from '@/components/tom-select/tom-select';

/* istanbul ignore next */
const TomSelect = defineAsyncComponent(() => import('@/components/tom-select/tom-select.vue'));
/* istanbul ignore next */
const Paginator = defineAsyncComponent(() => import('@/components/paginator/paginator.vue'));

export default defineComponent({
  name: 'InfiniteDropdown',
  components: { TomSelect, Paginator },
  props: {
    id: {
      type: String,
      default: () => uuid()
    },
    modelValue: {
      type: [String, Number, Boolean, Array, Object] as PropType<PModelValue>,
      default: ''
    },
    multiple: {
      type: Boolean,
      default: false
    },
    route: {
      type: String,
      required: true
    },
    params: {
      type: Object,
      default: null
    },
    label: {
      type: String,
      default: ''
    },
    parse: {
      type: Function,
      default: (item: any) => {
        return item;
      }
    },
    lazy: {
      type: Boolean,
      default: false
    },
    teleport: {
      type: String,
      default: 'body'
    }
  },
  emits: ['update:modelValue', 'update:totalItems'],
  data() {
    return {
      hasRunOnce: false,
      ready: false,
      loading: false,
      container: null as null | Element,
      search: null as null | string,
      page: 1,
      total: 0,
      items: [] as any[],
      localValue: null as PModelValue
    };
  },
  computed: {
    computedParams(): any {
      return { ...this.params, search: this.search };
    }
  },
  watch: {
    ready: function(newV) {
      if (newV && !this.lazy) {
        this.getContent();
      }
    },
    modelValue: {
      deep: true,
      handler: function(newV, oldV) {
        /* istanbul ignore else */
        if (JSON.stringify(newV) !== JSON.stringify(oldV)) {
          if (this.multiple) {
            this.localValue = newV ? (Array.isArray(newV) ? newV : [newV]) : [];
          } else {
            this.localValue = newV || null;
          }
        }
      }
    },
    localValue: {
      deep: true,
      handler: function(newV, oldV) {
        if (JSON.stringify(newV) !== JSON.stringify(oldV)) {
          this.$emit('update:modelValue', newV);
        }
      }
    }
  },
  created: function() {
    EventBus.$on(INFINITE_DROPDOWN_EVENTS.RESET, this.reset);
    if (this.multiple) {
      this.localValue = this.modelValue ? (Array.isArray(this.modelValue) ? this.modelValue : [this.modelValue]) : [];
    } else {
      this.localValue = this.modelValue || null;
    }
  },
  mounted: function() {
    /* DOM accessible via this.$el */
  },
  beforeUnmount: function() {
    EventBus.$off(INFINITE_DROPDOWN_EVENTS.RESET, this.reset);
  },
  methods: {
    getContent: function() {
      EventBus.$emit(PAGINATOR_EVENTS.SEARCH, { id: this.id });
      this.hasRunOnce = true;
    },
    onInput: function(search: string) {
      this.search = search;
      this.getContent();
    },
    onFocus: function() {
      if (this.lazy && !this.hasRunOnce) {
        this.getContent();
      }
    },
    loadContainer: function(id: string) {
      this.container = document.getElementById(`popper-${id}`);
    },
    onUpdateItems: function() {
      this.items = this.items.map((item) => this.parse(item));
    },
    reset: function(ev: any) {
      if (ev?.id === this.id) {
        this.localValue = [];
        // Reset only if not in a specific search (to avoid useless request)
        if (this.search) {
          this.page = 1;
          this.total = 0;
          this.items = [];
          this.search = null;
          // Get back original content
          this.getContent();
        }
      }
    }
  }
});
