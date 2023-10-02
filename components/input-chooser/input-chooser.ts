import { defineComponent } from 'vue';
import { v4 as uuid } from 'uuid';
import isNil from 'lodash.isnil';

interface IChooserData {
  id: string;
  value: string;
}

export default defineComponent({
  name: 'InputChooser',
  components: {},
  props: {
    type: {
      type: String,
      default: () => 'checkbox',
      validator: (value: string): boolean => {
        return ['checkbox', 'radio'].includes(value);
      }
    }, // checkbox || radio
    axis: {
      type: String,
      default: () => 'y',
      validator: (value: string): boolean => {
        return ['x', 'y'].includes(value);
      }
    },
    data: {
      type: Array,
      default: () => [],
      validator: (value: IChooserData[]): boolean => {
        return value.every((e: IChooserData) => {
          return typeof e === 'object' && e.id !== null && e.id !== undefined && e.id !== '' && e.value !== null && e.value !== undefined && e.value !== '';
        });
      }
    }, // [{id, value, class}]
    id: { type: String, default: () => '' },
    modelValue: { type: [String, Array, Boolean, Number], default: null },
    required: { type: Boolean, default: () => false },
    disabled: { type: Boolean, default: () => false },
    exclusive: { type: Boolean, default: () => false }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      valueInput: null as null | typeof this.modelValue,
      options: []
    };
  },
  computed: {},
  watch: {
    modelValue: {
      deep: true,
      handler: function(newV) {
        /* c8 ignore else */
        if (newV !== this.valueInput) {
          this.valueInput = this.modelValue as string;
        }
      }
    },
    valueInput: function(newV, oldV) {
      /* c8 ignore else */
      if (oldV !== newV && !((oldV === null || JSON.stringify(oldV) === '[]') && (newV === null || JSON.stringify(newV) === '[]'))) {
        this.$emit('update:modelValue', this.valueInput);
      }
    },
    /* eslint-disable @typescript-eslint/no-explicit-any */
    data: {
      deep: true,
      handler: function(newV, oldV) {
        if (JSON.stringify(oldV) !== JSON.stringify(newV)) {
          this.options = newV.map((e: any) => {
            return { ...e, uuid: uuid() };
          });
        }
      }
    }
  },
  created: function() {
    this.valueInput = this.modelValue;
    if (this.type === 'checkbox') {
      // Empty array instead of null
      if (isNil(this.valueInput)) this.valueInput = [];
      // Array instead of single value
      if (!Array.isArray(this.valueInput)) this.valueInput = [this.valueInput];
    }
    this.options = this.data.map((e: any) => {
      return { ...e, uuid: uuid() };
    }) as [];
  },
  mounted: function() {
    /* DOM accessible via this.$el */
  },
  beforeUnmount: function() {
    /* clean all non-Vue listeners/objects */
  },
  methods: {
    onClickItem: function(event: any) {
      /* c8 ignore else */
      if (this.type === 'checkbox' && this.exclusive) {
        if (JSON.stringify(this.valueInput) === JSON.stringify([event.target.value])) {
          this.valueInput = [];
        } else {
          this.valueInput = [event.target.value] as any;
        }
      }
    }
  }
});
