import { defineComponent, PropType, defineAsyncComponent } from 'vue';
import debounce from 'lodash.debounce';
import http from '@/http';
import axios, { Method } from 'axios';
import EventBus from '@/event-bus';
import { PAGINATOR_EVENTS } from '@/const';
import qs from 'qs';

const Spinner = defineAsyncComponent(() => import('@/components/spinner/spinner.vue'));

export interface IPaginator {
  id: string;
  page: number;
  items: any[];
  ready: boolean;
  loading: boolean;
  total: number;
  route?: string;
  params?: any;
  container?: HTMLElement | null;
}

export default defineComponent({
  name: 'Paginator',
  components: { Spinner },
  props: {
    id: {
      type: String,
      required: true
    },
    httpMethod: {
      type: String as PropType<'get' | 'post'>,
      default: 'get'
    },
    contentType: {
      type: String,
      default: 'application/json'
    },
    page: {
      type: Number,
      default: 1
    },
    pageSize: {
      type: Number,
      default: 20
    },
    additionalParams: {
      type: Object,
      default: () => ({})
    },
    keyLoop: {
      type: String,
      default: 'id'
    },
    url: {
      type: String,
      required: true
    },
    items: {
      type: Array as PropType<any[]>,
      default: () => []
    },
    container: {
      type: HTMLElement,
      default: null
    }
  },
  emits: ['update:page', 'update:items', 'update:totalItems', 'loading', 'error', 'raw-http-response'],
  data() {
    return {
      abortController: null as null | AbortController,
      totalItems: 0,
      getItemsDebounced: null as any,
      onScrollDebounced: null as any,
      loading: false
    };
  },
  computed: {
    params() {
      return {
        ...this.additionalParams,
        page: this.page,
        count: this.pageSize
      };
    }
  },
  watch: {
    totalItems() {
      this.$emit('update:totalItems', this.totalItems);
    },
    container: /* c8 ignore next */ function(newV, oldV) {
      oldV?.removeEventListener('scroll', this.onScrollDebounced);
      newV?.addEventListener('scroll', this.onScrollDebounced);
    },
    loading(newV) {
      this.$emit('loading', newV);
    }
  },
  created: function() {
    this.getItemsDebounced = debounce(this.getItems, 200);
    this.onScrollDebounced = debounce(this.onScroll, 200);
    EventBus.$on(PAGINATOR_EVENTS.SEARCH, this.search);
    EventBus.$on(PAGINATOR_EVENTS.CANCEL_PREVIOUS_REQUEST, this.onCancelPreviousRequest);
  },
  mounted: function() {
    /* c8 ignore if */
    if (this.container) {
      this.container.addEventListener('scroll', this.onScrollDebounced);
    }
  },
  beforeUnmount: function() {
    EventBus.$off(PAGINATOR_EVENTS.SEARCH, this.search);
    EventBus.$off(PAGINATOR_EVENTS.CANCEL_PREVIOUS_REQUEST, this.onCancelPreviousRequest);
    /* c8 ignore next */
    if (this.container) {
      this.container.removeEventListener('scroll', this.onScrollDebounced);
    }
  },
  methods: {
    onScroll(e: any) {
      const { target } = e;
      if (target.scrollTop > 0 && target.offsetHeight + target.scrollTop + target.offsetHeight * 0.2 > target.scrollHeight) {
        this.loadMore();
      }
    },
    search(ev: any) {
      if (ev?.id !== this.id) {
        return;
      }
      /* c8 ignore next */
      if (this.getItemsDebounced !== null) this.getItemsDebounced(true);
    },
    loadMore() {
      if (this.loading === false && this.items.length !== this.totalItems) {
        this.loading = true;
        // Display a spinner at the end of the project list and scroll to show it on screen
        this.$nextTick(() => {
          /* c8 ignore if */
          if (this.container) {
            this.container.scrollTo(0, this.container.scrollHeight);
          }
        });
        this.$emit('update:page', this.page + 1);
        /* c8 ignore next */
        if (this.getItemsDebounced !== null) this.getItemsDebounced();
      }
    },
    async getItems(isNewSearch = false) {
      this.abortController?.abort();
      this.abortController = new AbortController();
      this.loading = true;

      if (isNewSearch) {
        this.$emit('update:page', 1);
        this.$nextTick(() => {
          /* c8 ignore if */
          if (this.container) {
            this.container.scrollTo(0, 0);
          }
        });
      }

      this.$nextTick(async() => {
        try {
          const res = await http({
            url: `${import.meta.env.VITE_API_URL}${this.url}`,
            method: this.httpMethod as Method,
            [this.httpMethod === 'post' ? 'data' : 'params']:
              this.contentType === 'application/x-www-form-urlencoded' ? qs.stringify(this.params) : this.params,
            headers: { 'Content-Type': this.contentType },
            signal: this.abortController?.signal
          });
          /* c8 ignore else */
          if (res) {
            this.totalItems = res.data.total;
            // insere les données dans le tableau selon sa page
            const copyItems = isNewSearch ? [] : JSON.parse(JSON.stringify(this.items));
            copyItems.splice((res.data.page - 1) * this.pageSize, res.data.items.length, ...res.data.items);
            this.$emit('update:items', copyItems);
            this.$emit('raw-http-response', res.data);
          } else {
            this.$emit('update:items', []);
          }
        } catch (err) {
          /* c8 ignore next */
          if (axios.isCancel(err)) {
            return;
          }
          this.totalItems = 0;
          this.$emit('update:items', []);
          console.error(err);
          this.$emit('error', err);
        } finally {
          this.loading = false;
        }
      });
    },

    onCancelPreviousRequest(ev: any) {
      if (ev?.id !== this.id) {
        return;
      }
      this.abortController?.abort();
      this.getItemsDebounced.cancel();
    }
  }
});
