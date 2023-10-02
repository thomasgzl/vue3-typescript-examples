import { defineComponent, defineAsyncComponent, PropType } from 'vue';
import EventBus from '@/event-bus';
import http from '@/http';
import axios from 'axios';
import { GETTER_WRAPPER_EVENTS, GETTER_WRAPPER_LOAD_TYPES, GETTER_WRAPPER_EVENTS_TYPES } from '@/const';
const Spinner = defineAsyncComponent(() => import('@/components/spinner/spinner.vue'));
const ListErrors = defineAsyncComponent(() => import('@/components/list-errors/list-errors.vue'));

export interface IRouteLoad {
  id: string;
  url: string;
  options: Record<string, any>;
  ignoreFail?: boolean;
}
interface IGetterWrapperEvent {
  id: string;
  filterApiLoad: string[];
  loadType: GETTER_WRAPPER_LOAD_TYPES;
}
interface IData {
  // GETTER_WRAPPER_LOAD_TYPES: Enumerator,
  loadError: unknown;
  loadLoading: boolean;
  loadType: GETTER_WRAPPER_LOAD_TYPES;
  requests: Record<string, AbortController>;
}

export default defineComponent({
  name: 'GetterWrapper',
  components: { Spinner, ListErrors },
  props: {
    id: {
      type: String,
      required: true
    },
    apiLoad: {
      type: Array as PropType<IRouteLoad[]>,
      /* c8 ignore next */
      default: (): IRouteLoad[] => {
        return [];
      },
      validator: (value: IRouteLoad[]): boolean => {
        for (const item of value) {
          if (!item.id || !item.url) {
            return false;
          }
        }
        return true;
      }
    }
  },
  emits: [GETTER_WRAPPER_EVENTS_TYPES.DATA, GETTER_WRAPPER_EVENTS_TYPES.ERROR],
  data() {
    return {
      GETTER_WRAPPER_LOAD_TYPES: GETTER_WRAPPER_LOAD_TYPES,
      loadError: null,
      loadLoading: true,
      loadType: GETTER_WRAPPER_LOAD_TYPES.FULL,
      requests: {}
    } as IData;
  },
  created: function() {
    if (this.apiLoad.length) {
      this.load();
    } else {
      /* c8 ignore next */
      this.loadLoading = false;
    }
    EventBus.$on(GETTER_WRAPPER_EVENTS.LOAD, this.forceLoad);
  },
  beforeUnmount: function() {
    Object.keys(this.requests).forEach((req) => {
      this.requests[req].abort();
    });
    EventBus.$off(GETTER_WRAPPER_EVENTS.LOAD, this.forceLoad);
  },
  methods: {
    forceLoad: function(e: IGetterWrapperEvent) {
      if (e.id === this.id) {
        this.load(e.filterApiLoad, e.loadType);
      }
    },
    load: async function(filterApiLoad?: string[], loadType: GETTER_WRAPPER_LOAD_TYPES = GETTER_WRAPPER_LOAD_TYPES.FULL) {
      EventBus.$emit(GETTER_WRAPPER_EVENTS.UPDATE, { id: this.id, state: GETTER_WRAPPER_EVENTS_TYPES.LOADING });
      this.loadError = null;
      this.loadType = loadType;
      this.loadLoading = true;
      try {
        let apis: IRouteLoad[] = JSON.parse(JSON.stringify(this.apiLoad));
        if (filterApiLoad) {
          apis = apis.filter((api) => {
            return filterApiLoad.includes(api.id);
          });
        }

        const apisPromises: Promise<unknown>[] = [];
        apis.forEach((api) => {
          if (this.requests[api.id]) {
            this.requests[api.id].abort();
          }
          this.requests[api.id] = new AbortController();
          const options = { ...api.options, signal: this.requests[api.id].signal };
          apisPromises.push(http.get(`${import.meta.env.VITE_API_URL}${api.url}`, options));
        });

        const res = (await Promise.allSettled(apisPromises)) as PromiseSettledResult<any>[];
        const data: Record<string, unknown> = {};
        res.forEach((item, index) => {
          delete this.requests[apis[index].id];
          if (item.status === 'fulfilled') {
            data[apis[index].id] = item.value.data;
          } else {
            if (!apis[index].ignoreFail) {
              throw item.reason;
            }
          }
        });
        this.$emit(GETTER_WRAPPER_EVENTS_TYPES.DATA, data);
        EventBus.$emit(GETTER_WRAPPER_EVENTS.UPDATE, { id: this.id, state: GETTER_WRAPPER_EVENTS_TYPES.SUCCESS, data: data });
      } catch (error) {
        /* c8 ignore next */
        if (axios.isCancel(error)) {
          return;
        }
        this.loadError = error;
        this.$emit(GETTER_WRAPPER_EVENTS_TYPES.ERROR, error);
        EventBus.$emit(GETTER_WRAPPER_EVENTS.UPDATE, { id: this.id, state: GETTER_WRAPPER_EVENTS_TYPES.ERROR, data: error });
      } finally {
        this.loadLoading = false;
      }
    }
  }
});
