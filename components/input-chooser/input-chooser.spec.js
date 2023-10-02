import { describe, expect, it } from 'vitest';
import { mount, shallowMount } from '@vue/test-utils';
import InputChooser from '@/components/input-chooser/input-chooser.vue';
import { nextTick } from 'vue';
const defaultComponent = '<input id="input-chooser" type="checkbox" axis="y" data="data">';

describe('InputChooser', () => {
  it('Error display default values input', () => {
    const wrapper = shallowMount(InputChooser, { propsData: {}, slots: { default: defaultComponent } });
    expect(wrapper.find('#input-chooser').exists()).toBe(false);
    wrapper.unmount();
  });

  it('Test init value', async() => {
    let wrapper = mount(InputChooser, {
      propsData: {
        type: 'checkbox',
        axis: 'x',
        data: [
          { id: '1', value: 'one' },
          { id: '2', value: 'two' }
        ],
        modelValue: null
      }
    });
    expect(wrapper.vm.valueInput).toEqual([]);
    wrapper.unmount();

    wrapper = mount(InputChooser, {
      propsData: {
        type: 'checkbox',
        axis: 'x',
        data: [
          { id: '1', value: 'one' },
          { id: '2', value: 'two' }
        ],
        modelValue: 'test'
      }
    });
    expect(wrapper.vm.valueInput).toEqual(['test']);
  });

  it('Test checkbox', () => {
    const wrapper = mount(InputChooser, {
      propsData: {
        type: 'checkbox',
        axis: 'y',
        data: [
          { id: '1', value: 'one' },
          { id: '2', value: 'two' }
        ]
      }
    });
    wrapper.findAll('input').forEach((el) => {
      el.setChecked(true);
    });
    expect(wrapper.findAll('input').length).toEqual(2);
    expect(wrapper.findAll('input:checked').length).toEqual(2);
  });

  it('Test radio', async() => {
    const wrapper = mount(InputChooser, {
      propsData: {
        type: 'radio',
        axis: 'x',
        data: [
          { id: '3', value: 'three' },
          { id: '4', value: 'four' }
        ],
        modelValue: ''
      }
    });
    wrapper.findAll('input').forEach((el) => {
      el.setChecked(true);
    });
    await nextTick();
    expect(wrapper.findAll('input').length).toEqual(2);
    expect(wrapper.findAll('input:checked').length).toEqual(1);
    expect(wrapper.find('input:checked').element.value).toEqual('4');
  });

  it('Test watch', async function() {
    const wrapper = mount(InputChooser, {
      propsData: {
        type: 'checkbox',
        axis: 'x',
        data: [],
        modelValue: '',
        exclusive: true
      }
    });
    expect(wrapper.findAll('input').length).toEqual(0);
    wrapper.setProps({
      data: [
        { id: '3', value: 'three' },
        { id: '4', value: 'four' }
      ]
    });
    await nextTick();
    expect(wrapper.findAll('input').length).toEqual(2);

    wrapper.setProps({ modelValue: ['4'] });
    await nextTick();
    expect(wrapper.vm.$data.valueInput).toEqual(['4']);

    wrapper.find('input:checked').setValue(false);
    await nextTick();
    expect(wrapper.vm.$data.valueInput).toEqual([]);
  });

  it('Test onClickItem exclusive', async function() {
    const wrapper = mount(InputChooser, {
      propsData: {
        type: 'checkbox',
        axis: 'x',
        data: [
          { id: '3', value: 'three' },
          { id: '4', value: 'four' }
        ],
        modelValue: ['3'],
        exclusive: true
      }
    });
    wrapper.vm.onClickItem({ target: { value: '4' } });
    expect(wrapper.vm.$data.valueInput).toEqual(['4']);

    wrapper.vm.onClickItem({ target: { value: '4' } });
    expect(wrapper.vm.$data.valueInput).toEqual([]);
  });
});
