import { defineComponent, PropType } from 'vue';
import { createPopper, Instance } from '@popperjs/core';
import { v4 as uuidv4 } from 'uuid';
import { isNil } from 'lodash';

interface IOption {
  id: string;
  [x: string]: any;
  active?: boolean;
  disabled?: boolean;
}

export type PModelValue = string | number | boolean | any[] | null;

export default defineComponent({
  name: 'TomSelect',
  components: {},
  props: {
    modelValue: {
      type: [String, Number, Boolean, Array, Object] as PropType<PModelValue>,
      default: ''
    },
    options: {
      type: Array as PropType<IOption[]>,
      required: true,
      validator: (options: IOption[]): boolean => {
        if (Array.isArray(options) === false) return false;
        return options.every((o) => {
          return typeof o === 'object' && !isNil(o);
        });
      }
    },
    multiple: {
      type: Boolean,
      default: false
    },
    reduce: {
      type: Function,
      default: (opt: IOption) => {
        return opt;
      }
    },
    id: {
      type: String,
      default: uuidv4()
    },
    label: {
      type: String,
      default: 'value'
    },
    placeholder: {
      type: String,
      default: ''
    },
    selectable: {
      type: Function,
      default: () => {
        return true;
      }
    },
    filterable: {
      type: Boolean,
      default: true
    },
    keymapHandler: {
      type: Function as PropType<(map: any, vm: any) => any>,
      default: null
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    optionsListWidth: {
      type: Number,
      default: 0
    },
    ariaLabelledby: {
      type: String,
      default: ''
    },
    teleport: {
      type: String,
      default: 'body'
    }
  },
  emits: ['update:modelValue', 'input', 'input:blur', 'input:focus', 'mounted'],
  data() {
    return {
      uuid: uuidv4(),
      typedText: '',
      focused: false,
      selectedOptions: [] as IOption[],
      popper: null as null | Instance,
      activedescendant: null as null | string,
      defaultKeymap: {
        Backspace: () => {
          if (!this.typedText && this.selectedOptions.length) {
            // eslint-disable-next-line
            // @ts-ignore
            this.toggleOption(this.selectedOptions[this.selectedOptions.length - 1]);
          }
        },
        ArrowDown: (e: KeyboardEvent) => {
          e.preventDefault();
          e.stopPropagation();
          this.moveOption(1);
        },
        ArrowUp: (e: KeyboardEvent) => {
          e.preventDefault();
          e.stopPropagation();
          this.moveOption(-1);
        },
        Enter: (e: KeyboardEvent) => {
          e.preventDefault();
          e.stopPropagation();
          this.selectActiveOption();
        },
        Tab: () => {
          if (this.focused) this.loseFocus();
        }
      } as any,
      keyMap: null as any,
      displayNoData: false,
      timeoutDisplayNoData: 0
    };
  },
  computed: {
    displayOptions: function(): IOption[] {
      if (this.filterable === false) return this.options;
      if (this.focused === false) {
        return [];
      }
      return this.options.filter((option: IOption) => {
        if (option[this.label] !== undefined) {
          const normalizedOption = option[this.label]
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          const normalizedTyped = this.typedText
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          return normalizedOption.includes(normalizedTyped);
        }
        return false;
      });
    },
    displayedPlaceholder: function(): string {
      // If focused, single and something selected, display its value as placeholder
      if (this.focused && !this.multiple && this.selectedOptions.length) {
        return this.selectedOptions[0][this.label];
      }
      // Focused or not, if nothing selected, display default placeholder
      if (this.selectedOptions.length === 0) return this.placeholder;
      // Other cases (Multiple and something selected) don't display any placeholder
      return '';
      // selectedOptions.length ? (multiple ? '' : selectedOptions[0][label] ) : placeholder
    }
  },
  watch: {
    options: {
      immediate: true,
      deep: true,
      handler() {
        try {
          this.options.forEach((o: IOption) => {
            this.reduce(o);
          });
          this.findValue();
        } catch (e) {
          console.error('[Error] TomSelect : Invalid prop reduce.');
        }
      }
    },
    displayOptions: function(newV: any[]) {
      clearTimeout(this.timeoutDisplayNoData);
      if (newV.length === 0) {
        this.timeoutDisplayNoData = setTimeout(() => {
          this.displayNoData = true;
        }, 500);
      } else {
        this.displayNoData = false;
      }
    },
    modelValue: {
      deep: true,
      handler: function(newV: unknown, oldV: unknown) {
        if (JSON.stringify(newV) !== JSON.stringify(oldV)) {
          this.findValue();
        }
      }
    },
    focused: function(newV: boolean) {
      /* c8 ignore else */
      if (this.popper) {
        this.popper.update();
      }
      if (newV) {
        document.addEventListener('click', this.onDocumentClick);
        // If single select, and an option is selected
        if (!this.multiple && this.selectedOptions.length) {
          // Then focus this element
          this.activedescendant = JSON.stringify(this.reduce(this.displayOptions.find((opt) => this.compare(this.selectedOptions[0], opt))));
          // And scroll to it
          this.$nextTick(() => {
            const indexActiveDescendant = this.displayOptions.findIndex((opt) => {
              return JSON.stringify(this.reduce(opt)) === this.activedescendant;
            });
            const domItemActive = document.querySelector(`#tselect-option-${this.uuid}-${indexActiveDescendant}`) as HTMLElement;
            /* c8 ignore start */
            if (domItemActive) {
              const parent = domItemActive.parentElement;
              if (parent && parent.scrollHeight > parent.clientHeight) {
                parent.scrollTop = domItemActive.offsetTop;
              }
            }
            /* c8 ignore stop */
          });
        }
      } else {
        this.typedText = '';
        document.removeEventListener('click', this.onDocumentClick);
      }
    },
    typedText: function(newV: string) {
      this.$emit('input', newV);
    }
  },
  created: function() {
    if (this.keymapHandler) {
      this.keyMap = this.keymapHandler(this.defaultKeymap, this);
    } else {
      this.keyMap = this.defaultKeymap;
    }
    this.findValue();
  },
  mounted: function() {
    const rootDom = this.$refs['root-dom'] as HTMLElement;
    /* c8 ignore next */
    const refElement: HTMLElement = rootDom.parentElement?.classList.contains('input-group') ? rootDom.parentElement : rootDom;

    const width = () => {
      return this.optionsListWidth ? this.optionsListWidth : refElement.getBoundingClientRect().width;
    };

    (this.$refs['display-options'] as HTMLElement).style.width = `${width()}px`;

    this.popper = createPopper(rootDom, this.$refs['display-options'] as HTMLElement, {
      placement: 'bottom-start',
      modifiers: [
        {
          name: 'placementLogger',
          enabled: true,
          phase: 'main',
          fn: ({ state }) => {
            (this.$refs['display-options'] as HTMLElement).style.width = `${width()}px`;
            /* c8 ignore start */
            if (state.placement.substring(0, 3) === 'top') {
              (this.$refs['root-dom'] as HTMLElement).classList.add('tselect--ontop');
              (this.$refs['display-options'] as HTMLElement).classList.add('tselect--ontop');
            } else {
              (this.$refs['root-dom'] as HTMLElement).classList.remove('tselect--ontop');
              (this.$refs['display-options'] as HTMLElement).classList.remove('tselect--ontop');
            }
            /* c8 ignore stop */
          }
        }
      ]
    });

    this.$el.addEventListener('clear', this.clear);

    this.$nextTick(() => {
      this.$emit('mounted', this.uuid);
    });
  },
  beforeUnmount: function() {
    document.removeEventListener('click', this.onDocumentClick);
    this.$el.removeEventListener('clear', this.clear);
    /* c8 ignore next */
    if (this.popper) this.popper.destroy();
  },
  methods: {
    refreshSelectedOptions: function() {
      if (this.popper) {
        this.popper.update();
      }
      if (this.multiple) {
        const dataToSend = this.selectedOptions.map((opt) => {
          return this.reduce(opt);
        });
        if (JSON.stringify(dataToSend) !== JSON.stringify(this.modelValue)) {
          this.$emit('update:modelValue', dataToSend);
        }
      } else {
        if (this.selectedOptions.length && this.selectedOptions[0]) {
          const dataToSend = this.reduce(this.selectedOptions[0]);
          if (JSON.stringify(dataToSend) !== JSON.stringify(this.modelValue)) {
            this.$emit('update:modelValue', dataToSend);
          }
        } else {
          // If modelValue is already falsy, do not send an event
          // Avoid useless event (empty string to null or first call null to null) avoid $dirty on field by modelValue change
          if (this.modelValue !== null && this.modelValue !== '') {
            this.$emit('update:modelValue', null);
          }
        }
      }
    },
    findValue: function() {
      this.selectedOptions = [];
      if (!isNil(this.modelValue) && this.modelValue !== '') {
        let tmpSelected = JSON.parse(JSON.stringify(this.modelValue));
        if (!Array.isArray(tmpSelected)) tmpSelected = [tmpSelected];
        if (this.filterable) {
          // static options
          tmpSelected.forEach((value: any) => {
            const option = this.options.find((opt) => this.compare(value, opt));
            if (option) {
              this.selectedOptions.push(option);
            } else {
              // inject the option not found to show user that there is something in DB
              const newOption = typeof value === 'object' ? value : { id: value, [this.label]: value };
              this.selectedOptions.push(newOption);
            }
          });
        } else {
          // If not filterable, do not filter selected values according to options, just take modelValue
          // The parent should manage his data and in props new values, aka pagined options
          this.selectedOptions = tmpSelected;
        }
      }
      this.refreshSelectedOptions();
    },
    compare: function(value: any, option: any) {
      // If options have IDs
      if (!isNil(option.id)) {
        // Try compare with value id (if value have id)
        if (!isNil(value.id)) return value.id === option.id;
        // Else, if value is of a raw type similar to option's id, compare
        if (typeof value === typeof option.id) return value === option.id;
      }
      // If option can be reduced
      if (!isNil(this.reduce(option))) {
        // And value can be reduced, compare
        if (!isNil(this.reduce(value))) return JSON.stringify(this.reduce(value)) === JSON.stringify(this.reduce(option));
        // Else, compare value with reduced option, value is probably already reduced
        return JSON.stringify(value) === JSON.stringify(this.reduce(option));
      }
      // Else simply compare stringified version of value and option
      return JSON.stringify(value) === JSON.stringify(option);
    },
    onDocumentClick: function(ev: MouseEvent) {
      const rootDom = this.$refs['root-dom'] as HTMLElement;
      /* c8 ignore next */
      const refElement: HTMLElement = rootDom.parentElement?.classList.contains('input-group') ? rootDom.parentElement : rootDom;
      if (refElement.contains(ev.target as Node)) {
        // keep displayList
      } else {
        this.loseFocus();
      }
    },
    toggleOption: function(opt: IOption, avoidDeselect = false) {
      if (!this.selectable(opt)) {
        return; // not selectable
      }
      if (this.multiple) {
        if (this.selectedOptions.find((o) => JSON.stringify(o) === JSON.stringify(opt))) {
          // Don't deselect on click in option list
          if (!avoidDeselect) {
            this.selectedOptions = this.selectedOptions.filter((o) => {
              return JSON.stringify(o) !== JSON.stringify(opt);
            });
            this.loseFocus();
          }
        } else {
          this.selectedOptions.push(opt);
          this.loseFocus();
        }
      } else {
        this.selectedOptions = [opt];
        this.loseFocus();
      }
      this.refreshSelectedOptions();
    },
    focusInput: function() {
      if (!this.disabled) (this.$refs.input as HTMLElement).focus();
    },
    moveOption: function(direction: number) {
      if (this.focused === false) {
        this.focused = true;
      }
      if (this.activedescendant === null) {
        this.activedescendant = JSON.stringify(this.reduce(this.displayOptions[0]));
        return;
      }
      const indexActiveDescendant = this.displayOptions.findIndex((opt) => {
        return JSON.stringify(this.reduce(opt)) === this.activedescendant;
      });
      const domItemActive = document.querySelector(`#tselect-option-${this.uuid}-${indexActiveDescendant}`);
      /* c8 ignore start */
      if (domItemActive) {
        const parent = domItemActive.parentElement;
        if (parent && parent.scrollHeight > parent.clientHeight) {
          domItemActive.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
        }
      }
      /* c8 ignore stop */
      const minMaxIndex = Math.max(Math.min(indexActiveDescendant + direction, this.displayOptions.length - 1), 0);
      this.activedescendant = JSON.stringify(this.reduce(this.displayOptions[minMaxIndex]));
    },
    selectActiveOption: function() {
      if (this.focused === false) {
        return;
      }
      const found = this.displayOptions.find((opt) => {
        return JSON.stringify(this.reduce(opt)) === this.activedescendant;
      });
      if (found) {
        this.toggleOption(found);
      }
      this.typedText = '';
    },
    loseFocus: function() {
      this.focused = false;
      this.typedText = '';
      this.$emit('input:blur');
    },
    gainFocus: function() {
      this.focused = true;
      this.$emit('input:focus');
    },
    handleKey: function(e: KeyboardEvent) {
      const f = this.keyMap[e.code];
      if (f) f(e);
    },
    clear: function() {
      this.selectedOptions = [];
      this.refreshSelectedOptions();
      this.loseFocus();
    }
  }
});
