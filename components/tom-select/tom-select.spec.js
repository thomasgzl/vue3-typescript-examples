import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import TomSelect from '@/components/tom-select/tom-select.vue';
import { nextTick, h } from 'vue';
import { sleep } from './helpers/utils';

vi.mock('@/utils/i18n', () => {
  return {
    i18n: {
      t: (params) => {
        return params;
      }
    }
  };
});

const DEFAULT_OPTIONS = [
  { id: 0, value: 0, active: true },
  { id: 1, value: 1, active: false },
  { id: 2, value: 2, active: true }
];

describe('TomSelect', () => {
  it('Display single select', async() => {
    const wrapper = mount(TomSelect, { propsData: { options: DEFAULT_OPTIONS, optionsListWidth: 500 } });
    await nextTick();
    const displayOptions = wrapper.vm.$refs['display-options'];

    // Display element
    expect(wrapper.find('input').exists()).toBe(true);
    expect(wrapper.find('.tselect__container').exists()).toBe(true);
    expect(displayOptions.style.display).toBe('none');
    expect(displayOptions.querySelectorAll('li').length).toEqual(0);

    // Test forced width passed through parameters
    expect(displayOptions.style.width).toBe('500px');

    // On focus (click)
    await wrapper.find('input').trigger('focus');
    await nextTick();

    // Display options
    expect(displayOptions.style.display).toBe('');
    expect(displayOptions.querySelectorAll('li').length).toEqual(3);

    // When input search
    wrapper.vm.typedText = '1';
    await nextTick();

    // Display filtered options
    expect(displayOptions.querySelectorAll('li').length).toEqual(1);
    expect(wrapper.vm.selectedOptions.length).toEqual(0);

    // On click option
    await displayOptions.querySelector('li').click();
    await nextTick();

    // Select option
    expect(displayOptions.style.display).toBe('none');
    expect(wrapper.vm.selectedOptions.length).toEqual(1);
    expect(wrapper.vm.selectedOptions[0].id).toEqual(1);

    // On click other option
    await wrapper.find('input').trigger('focus');
    await nextTick();
    await sleep(200); // Need to wait a little more to wait watcher nextTick to execute
    await displayOptions.querySelector('li').click();
    await nextTick();

    // Replace current option
    expect(wrapper.vm.selectedOptions.length).toEqual(1);
    expect(wrapper.vm.selectedOptions[0].id).toEqual(0);

    wrapper.unmount();
  });

  it('Filter out incorrect options', async() => {
    const wrapper = mount(TomSelect, { propsData: { options: [...DEFAULT_OPTIONS, { id: 3, name: 3, active: true }] } });
    await wrapper.find('input').trigger('focus');
    await nextTick();
    await sleep(600); // Time for timeout of displayOption to trigger (code coverage purpose)
    expect(wrapper.vm.displayOptions.length).toEqual(3);
  });

  it('Display multi select', async() => {
    const wrapper = mount(TomSelect, { propsData: { options: DEFAULT_OPTIONS, multiple: true } });
    await nextTick();
    const displayOptions = wrapper.vm.$refs['display-options'];
    // Display element, focus, display options, click first option
    expect(wrapper.find('input').exists()).toBe(true);
    await wrapper.find('input').trigger('focus');
    await nextTick();
    expect(displayOptions.querySelectorAll('li').length).toEqual(3);
    await displayOptions.querySelector('li').click();
    await nextTick();

    // One selected option
    expect(wrapper.vm.selectedOptions.length).toEqual(1);
    expect(wrapper.vm.selectedOptions[0].id).toEqual(0);

    // Filter then, select other option
    await wrapper.find('input').trigger('focus');
    wrapper.vm.typedText = '1';
    await nextTick();
    await displayOptions.querySelector('li').click();
    await nextTick();

    // Two options selected
    expect(wrapper.vm.selectedOptions.length).toEqual(2);
    expect(wrapper.vm.selectedOptions[0].id).toEqual(0);
    expect(wrapper.vm.selectedOptions[1].id).toEqual(1);

    wrapper.unmount();
  });

  it('Can be disabled', async() => {
    const wrapper = mount(TomSelect, { propsData: { options: DEFAULT_OPTIONS, disabled: true } });
    await nextTick();
    const displayOptions = wrapper.vm.$refs['display-options'];
    // Display element
    expect(wrapper.find('input').exists()).toBe(true);
    expect(wrapper.find('input').isDisabled()).toBe(true);
    expect(displayOptions.style.display).toBe('none');

    // On focus (click)
    await wrapper.find('input').trigger('focus');
    await nextTick();

    // Still no options display
    expect(displayOptions.style.display).toBe('none');

    // Try forcing focus
    wrapper.vm.focusInput();
    await nextTick();

    // Still no options display
    expect(displayOptions.style.display).toBe('none');

    wrapper.unmount();
  });

  it('Disable element not selectable', async() => {
    const wrapper = mount(TomSelect, { propsData: { options: DEFAULT_OPTIONS, selectable: (o) => o.active !== false } });
    await nextTick();
    const displayOptions = wrapper.vm.$refs['display-options'];
    // Display element
    expect(wrapper.find('input').exists()).toBe(true);
    expect(displayOptions.querySelectorAll('li').length).toEqual(0);

    // On focus (click)
    await wrapper.find('input').trigger('focus');
    await nextTick();

    // Only two of three elements are enabled
    expect(displayOptions.querySelectorAll('li[aria-disabled=false]').length).toEqual(2);

    // Clicking disabled option doesn't select it
    expect(wrapper.vm.selectedOptions.length).toEqual(0);
    await displayOptions.querySelector('li[aria-disabled=true]').click();
    await nextTick();
    expect(wrapper.vm.selectedOptions.length).toEqual(0);

    wrapper.unmount();
  });

  it('Can use reduce function', async() => {
    let wrapper = mount(TomSelect, { propsData: { options: DEFAULT_OPTIONS, modelValue: null } });
    await nextTick();
    let displayOptions = wrapper.vm.$refs['display-options'];
    // Display element and select first option
    expect(wrapper.find('input').exists()).toBe(true);
    await wrapper.find('input').trigger('focus');
    await nextTick();
    await displayOptions.querySelector('li').click();
    await nextTick();

    // Default behavior
    expect(wrapper.emitted()['update:modelValue'][0]).toEqual([DEFAULT_OPTIONS[0]]);

    wrapper.unmount();

    wrapper = mount(TomSelect, { propsData: { options: DEFAULT_OPTIONS, modelValue: null, reduce: (o) => o.id } });
    displayOptions = wrapper.vm.$refs['display-options'];
    // Display element and select first option
    expect(wrapper.find('input').exists()).toBe(true);
    await wrapper.find('input').trigger('focus');
    await nextTick();
    await displayOptions.querySelector('li').click();
    await nextTick();

    // Reduced behavior
    expect(wrapper.emitted()['update:modelValue'][0]).toEqual([0]);

    wrapper.unmount();
  });

  it('Handle modelValue changes', async() => {
    const wrapper = mount(TomSelect, { propsData: { options: DEFAULT_OPTIONS, modelValue: { id: 0, value: 0 } } });
    wrapper.setProps({ modelValue: { id: 2, value: 2 } });
    await nextTick();

    // Selected option changed
    expect(wrapper.vm.selectedOptions).toEqual([DEFAULT_OPTIONS[2]]);

    // Set back same modelValue (Test coverage purpose)
    wrapper.setProps({ modelValue: { id: 2, value: 2 } });
    await nextTick();

    // No changes
    expect(wrapper.vm.selectedOptions).toEqual([DEFAULT_OPTIONS[2]]);
    wrapper.unmount();
  });

  it('Can deselect option multiple', async() => {
    const wrapper = mount(TomSelect, { propsData: { options: DEFAULT_OPTIONS, multiple: true, modelValue: [1], reduce: (o) => o.id } });
    await nextTick();
    const displayOptions = wrapper.vm.$refs['display-options'];
    expect(wrapper.vm.selectedOptions.length).toEqual(1);
    // Dont deselect on click option
    await wrapper.find('input').trigger('focus');
    await nextTick();
    await displayOptions.querySelector('li[aria-selected=true]').click();
    await nextTick();
    expect(wrapper.vm.selectedOptions.length).toEqual(1);

    // Deselect on clear btn
    expect(wrapper.find('.tselect__selected-option').exists()).toBe(true);
    expect(wrapper.find('.tselect__selected-option-remove').exists()).toBe(true);
    await wrapper.find('.tselect__selected-option-remove').trigger('click');
    await nextTick();

    // No more selected options
    expect(wrapper.find('.tselect__selected-option').exists()).toBe(false);
    expect(wrapper.vm.selectedOptions.length).toEqual(0);
    wrapper.unmount();
  });

  it('Can deselect option single (clear)', async() => {
    const wrapper = mount(TomSelect, { propsData: { options: DEFAULT_OPTIONS, modelValue: [1], reduce: (o) => o.id } });
    expect(wrapper.vm.selectedOptions.length).toEqual(1);
    wrapper.vm.clear();
    await nextTick();

    // No more selected options
    expect(wrapper.vm.selectedOptions.length).toEqual(0);
    // Last emitted event null
    expect(wrapper.emitted()['update:modelValue'][wrapper.emitted()['update:modelValue'].length - 1]).toEqual([null]);
    wrapper.unmount();
  });

  it('Handle non existing option selected', async() => {
    let wrapper = mount(TomSelect, { propsData: { options: DEFAULT_OPTIONS, modelValue: 4, reduce: (o) => o.id } });
    expect(wrapper.vm.selectedOptions.length).toEqual(1);
    expect(wrapper.vm.selectedOptions[0]).toEqual({ id: 4, value: 4 });
    wrapper.unmount();

    wrapper = mount(TomSelect, { propsData: { options: DEFAULT_OPTIONS, modelValue: { id: 4, value: 4 }, reduce: (o) => o.id } });
    expect(wrapper.vm.selectedOptions.length).toEqual(1);
    expect(wrapper.vm.selectedOptions[0]).toEqual({ id: 4, value: 4 });
    wrapper.unmount();
  });

  it('Handle keyboard inputs', async() => {
    let spy = false;
    const keymapHandler = (map) => {
      return {
        ...map,
        CustomKey: () => {
          spy = true;
        }
      };
    };
    const wrapper = mount(TomSelect, { propsData: { options: DEFAULT_OPTIONS, keymapHandler } });
    await nextTick();
    const displayOptions = wrapper.vm.$refs['display-options'];
    // Not focused, nothing selected
    expect(wrapper.vm.selectedOptions.length).toEqual(0);
    expect(wrapper.vm.activedescendant).toEqual(null);
    expect(wrapper.vm.focused).toBe(false);

    // Click div (launch function to focusInput)
    await wrapper.find('.tselect__container').trigger('click');
    await nextTick();
    // Force focus (JSDOM issue)
    await wrapper.find('input').trigger('focus');
    await nextTick();
    // Now focused
    expect(wrapper.vm.focused).toBe(true);
    expect(wrapper.vm.activedescendant).toEqual(null);
    // Use arrow key to go down
    await wrapper.find('input').trigger('keydown', { code: 'ArrowDown' });
    await nextTick();
    // First option is now hovered
    expect(displayOptions.querySelectorAll('li')[0].classList.contains('hover')).toBe(true);
    expect(displayOptions.querySelectorAll('li')[1].classList.contains('hover')).toBe(false);
    expect(wrapper.vm.activedescendant).toEqual(JSON.stringify(DEFAULT_OPTIONS[0]));
    // Go down
    await wrapper.find('input').trigger('keydown', { code: 'ArrowDown' });
    await nextTick();
    // Second option is now hovered
    expect(displayOptions.querySelectorAll('li')[0].classList.contains('hover')).toBe(false);
    expect(displayOptions.querySelectorAll('li')[1].classList.contains('hover')).toBe(true);
    expect(wrapper.vm.activedescendant).toEqual(JSON.stringify(DEFAULT_OPTIONS[1]));
    // Go up
    await wrapper.find('input').trigger('keydown', { code: 'ArrowUp' });
    await nextTick();
    // First option is now hovered
    expect(displayOptions.querySelectorAll('li')[0].classList.contains('hover')).toBe(true);
    expect(displayOptions.querySelectorAll('li')[1].classList.contains('hover')).toBe(false);
    expect(wrapper.vm.activedescendant).toEqual(JSON.stringify(DEFAULT_OPTIONS[0]));
    // Press enter to select item
    await wrapper.find('input').trigger('keydown', { code: 'Enter' });
    await nextTick();
    // Item selected + options hidden
    expect(wrapper.vm.selectedOptions.length).toEqual(1);
    expect(wrapper.vm.selectedOptions[0]).toEqual(DEFAULT_OPTIONS[0]);
    expect(displayOptions.querySelector('li')).toBe(null);

    // Go to multiple mode to remove selected element
    wrapper.setProps({ multiple: true });
    wrapper.find('input').setValue('a');
    await nextTick();
    expect(wrapper.vm.typedText).toEqual('a');
    expect(wrapper.vm.selectedOptions.length).toEqual(1);
    // Backspace
    await wrapper.find('input').trigger('keydown', { code: 'Backspace' });
    await nextTick();
    // Triggering backspace outside browser on input, doesn't actually remove character
    // But item is still selected
    expect(wrapper.vm.selectedOptions.length).toEqual(1);
    // Manually remove character
    wrapper.find('input').setValue('');
    // Then trigger backspace
    await wrapper.find('input').trigger('keydown', { code: 'Backspace' });
    await nextTick();
    // No more items selected
    expect(wrapper.vm.selectedOptions.length).toEqual(0);

    // Call custom key in keyMap
    expect(spy).toBe(false);
    await wrapper.find('input').trigger('keydown', { code: 'CustomKey' });
    expect(spy).toBe(true);

    // No error when triggering unmapped key (coverage purpose)
    await wrapper.find('input').trigger('keydown', { code: 'UnknownKey' });

    // Tab to lose focus
    await wrapper.find('input').trigger('focus');
    await nextTick();
    expect(wrapper.vm.focused).toBe(true);
    await wrapper.find('input').trigger('keydown', { code: 'Tab' });
    await nextTick();
    expect(wrapper.vm.focused).toBe(false);
    // Still unfocused after another tab (Test coverage purpose)
    await wrapper.find('input').trigger('keydown', { code: 'Tab' });
    await nextTick();
    expect(wrapper.vm.focused).toBe(false);

    wrapper.unmount();
  });

  it('Auto set focus when moving arrows', async() => {
    const wrapper = mount(TomSelect, { propsData: { options: DEFAULT_OPTIONS } });

    expect(wrapper.vm.focused).toBe(false);
    await wrapper.find('input').trigger('keydown', { code: 'ArrowDown' });
    await nextTick();
    expect(wrapper.vm.focused).toBe(true);

    wrapper.unmount();
  });

  it('Remove focus when clicking outside', async() => {
    const wrapper = mount(TomSelect, { propsData: { options: DEFAULT_OPTIONS }, attachTo: document.body });
    await wrapper.find('input').trigger('focus');
    await nextTick();
    expect(wrapper.vm.focused).toBe(true);

    // Clicking on component keeps focus
    await wrapper.trigger('click');
    await nextTick();
    expect(wrapper.vm.focused).toBe(true);

    // While clicking on other document element to lose focus
    const secondWrapper = mount(
      () => {
        h('div', 'otherComponent');
      },
      { attachTo: document.body }
    );
    await secondWrapper.trigger('click');
    await nextTick();
    expect(wrapper.vm.focused).toBe(false);

    secondWrapper.unmount();
    wrapper.unmount();
  });

  it('Triggers props validator', async() => {
    const validator = TomSelect.props.options.validator;
    expect(validator(DEFAULT_OPTIONS)).toBe(true);
    expect(validator('error')).toBe(false);
  });

  it('Trigger reduce custom validator', async() => {
    // Temporary disable console.error (to avoid display in test results)
    const originalError = console.error;
    console.error = vi.fn();
    vi.spyOn(global.console, 'error');

    const wrapper = mount(TomSelect, { propsData: { options: DEFAULT_OPTIONS, reduce: (o) => o.not.a.valid.reduce } });

    await nextTick();
    expect(console.error).toHaveBeenCalled();

    // Reenable console.error
    console.error = originalError;

    wrapper.unmount();
  });

  it('Prevent selection if not focused', async() => {
    const wrapper = mount(TomSelect, { propsData: { options: DEFAULT_OPTIONS } });
    expect(wrapper.vm.selectedOptions.length).toEqual(0);

    await wrapper.find('input').trigger('keydown', { code: 'Enter' });
    await nextTick();
    expect(wrapper.vm.selectedOptions.length).toEqual(0);

    wrapper.unmount();
  });

  it('Prevent selection through enter key, if no selected element', async() => {
    const wrapper = mount(TomSelect, { propsData: { options: DEFAULT_OPTIONS } });
    await wrapper.find('input').trigger('focus');
    await nextTick();
    expect(wrapper.vm.focused).toBe(true);
    expect(wrapper.vm.selectedOptions.length).toEqual(0);

    await wrapper.find('input').trigger('keydown', { code: 'Enter' });
    await nextTick();
    expect(wrapper.vm.selectedOptions.length).toEqual(0);

    wrapper.unmount();
  });

  it('Can be set to prevent option filter while typing', async() => {
    const wrapper = mount(TomSelect, { propsData: { options: DEFAULT_OPTIONS, filterable: false } });
    await nextTick();
    const displayOptions = wrapper.vm.$refs['display-options'];
    await wrapper.find('input').trigger('focus');
    await nextTick();

    // Display options
    expect(displayOptions.querySelectorAll('li').length).toEqual(3);

    // When input search
    wrapper.vm.typedText = '1';
    await nextTick();

    // Display non filtered options
    expect(displayOptions.querySelectorAll('li').length).toEqual(3);

    // Can pass any value in modelValue, without being filtered from options
    expect(wrapper.vm.selectedOptions.length).toEqual(0);
    wrapper.setProps({ modelValue: [{ id: 4, otherLabel: 4 }] });
    await nextTick();
    expect(wrapper.vm.selectedOptions.length).toEqual(1);
    // Instead of { id: 4, value: 4 }
    expect(wrapper.vm.selectedOptions[0]).toEqual({ id: 4, otherLabel: 4 });

    wrapper.unmount();
  });

  it('Can compare different items', async() => {
    let defaultOption = { id: 0, value: 0 };
    const wrapper = mount(TomSelect, { propsData: { options: [defaultOption] } });

    expect(wrapper.vm.compare({ id: 0, value: 0 }, defaultOption)).toBe(true);
    expect(wrapper.vm.compare({ id: 1, value: 1 }, defaultOption)).toBe(false);
    expect(wrapper.vm.compare(0, defaultOption)).toBe(true);
    expect(wrapper.vm.compare(1, defaultOption)).toBe(false);
    expect(wrapper.vm.compare('0', defaultOption)).toBe(false);

    wrapper.setProps({ reduce: (o) => o.code });
    await nextTick();
    defaultOption = { code: 0, value: 0 };

    expect(wrapper.vm.compare({ code: 0, value: 0 }, defaultOption)).toBe(true);
    expect(wrapper.vm.compare({ code: 1, value: 1 }, defaultOption)).toBe(false);
    expect(wrapper.vm.compare(0, defaultOption)).toBe(true);
    expect(wrapper.vm.compare(1, defaultOption)).toBe(false);
    expect(wrapper.vm.compare('0', defaultOption)).toBe(false);

    wrapper.setProps({ reduce: (o) => o.error });
    await nextTick();

    expect(wrapper.vm.compare({ code: 0, value: 0 }, defaultOption)).toBe(true);
    expect(wrapper.vm.compare({ code: 1, value: 1 }, defaultOption)).toBe(false);

    wrapper.unmount();
  });
});
