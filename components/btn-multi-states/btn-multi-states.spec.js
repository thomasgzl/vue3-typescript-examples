import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { sleep } from './helpers/utils';
import BtnMultiStates from '@/components/btn-multi-states/btn-multi-states.vue';
import { nextTick } from 'vue';

vi.mock('@/utils/override-css', () => {
  return { overrideBtnCssClass: (s1, s2) => `${s1} ${s2}` };
});
vi.mock('@/const', () => {
  return { BTN_MULTI_STATES: { IDLE: 'idle', LOADING: 'loading', ERROR: 'error', SUCCESS: 'success' } };
});

describe('BtnMultiStates', () => {
  it('Idle', () => {
    const wrapper = mount(BtnMultiStates, { propsData: { state: 'idle' } });
    expect(wrapper.find('span').text()).toEqual('save');
  });
  it('Loading', async() => {
    const wrapper = mount(BtnMultiStates, { propsData: { state: 'idle' } });
    wrapper.setProps({ state: 'idle' });
    await nextTick();
    expect(wrapper.find('svg')).not.toBeNull();
  });
  it('Error', async() => {
    const wrapper = mount(BtnMultiStates, { propsData: { state: 'idle' } });
    wrapper.setData({ TIME_AUTO: 100 });
    wrapper.setProps({ state: 'error' });
    await nextTick();
    expect(wrapper.find('span').text()).toEqual('error');
    await sleep(100);
    expect(wrapper.find('span').text()).toEqual('save');
  });
  it('Success', async() => {
    const wrapper = mount(BtnMultiStates, { propsData: { state: 'idle' } });
    wrapper.setData({ TIME_AUTO: 100 });
    wrapper.setProps({ state: 'success' });
    await nextTick();
    expect(wrapper.find('span').text()).toEqual('success');
    await sleep(100);
    expect(wrapper.find('span').text()).toEqual('save');
  });
  it('Override btn classes', async() => {
    const wrapper = mount(BtnMultiStates, { propsData: { state: 'idle' } });
    expect(wrapper.find('button').classes().includes('btn-weak')).toBe(false);
    expect(wrapper.find('button').classes().includes('btn-fw')).toBe(true);
    wrapper.setProps({ fixedWidth: false, btnClassOverride: 'btn-weak' });
    await nextTick();
    expect(wrapper.find('button').classes().includes('btn-weak')).toBe(true);
    expect(wrapper.find('button').classes().includes('btn-fw')).toBe(false);
  });
});
