import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import GetterWrapper from '@/components/getter-wrapper/getter-wrapper.vue';
import { sleep } from './helpers/utils';
import { h, nextTick } from 'vue';

const mockListErrors = h('div', 'ListErrors');
const mockSpinner = h('svg', 'Spinner');
vi.mock('@/components/list-errors/list-errors.vue', () => {
  return { default: { render: () => mockListErrors }, __esModule: vi.fn() };
});
vi.mock('@/components/spinner/spinner.vue', () => {
  return { default: { render: () => mockSpinner }, __esModule: vi.fn() };
});

async function mockApi(url) {
  if (url.includes('/error')) {
    throw new Error('fake error');
  } else {
    if (url.includes('/delay')) {
      await sleep(150);
    }
    return true;
  }
}
vi.mock('@/http', () => {
  return { default: { get: vi.fn().mockImplementation(mockApi) } };
});

describe('GetterWrapper', () => {
  it('Default slot', async function() {
    const wrapper = mount(GetterWrapper, {
      props: { id: 'test', apiLoad: [{ url: 'url/de/test', id: 'test', options: null }] },
      slots: { default: '<div class="getter-slot">slot for getter</div>' }
    });

    await sleep(100);
    // Verify if form is here
    expect(wrapper.find('.getter-slot').exists()).toBe(true);
    wrapper.unmount();
  });

  it('Validator props', async function() {
    const wrapper = mount(GetterWrapper, {
      propsData: { id: 'test', apiLoad: [] },
      slots: { default: '<div class="getter-slot">slot for getter</div>' }
    });
    const validator = wrapper.vm.$options.props.apiLoad.validator;
    expect(validator([{ url: 'url/de/test', id: 'test' }])).toBe(true);
    expect(validator([{ test: false }])).toBe(false);
    wrapper.unmount();
  });

  it('Load ressources as props', async() => {
    const wrapper = mount(GetterWrapper, {
      slots: { default: '<div class="getter-slot">slot for getter</div>' },
      props: { id: 'test', apiLoad: [{ url: 'url/de/test/delay', id: 'test', options: null }] }
    });
    await sleep(50);
    // Verify if spinner is loading
    expect(wrapper.text()).toEqual('Spinner');
    wrapper.unmount();
  });

  it('Load ressources when forced', () => {
    const wrapper = mount(GetterWrapper, {
      slots: { default: '<div class="getter-slot">slot for getter</div>' },
      propsData: {
        id: 'fake-id',
        apiLoad: [{ url: 'url/de/test', id: 'test', options: null }]
      }
    });
    wrapper.vm.forceLoad({ id: 'wrong-id' });
    wrapper.vm.forceLoad({ id: 'fake-id' });
    expect(wrapper.text()).toEqual('Spinner');
    wrapper.unmount();
  });

  it('Load filtered ressources', () => {
    const wrapper = mount(GetterWrapper, {
      slots: { default: '<div class="getter-slot">slot for getter</div>' },
      propsData: {
        id: 'fake-id',
        apiLoad: [{ url: 'url/de/test', id: 'test', options: null }]
      }
    });
    wrapper.vm.forceLoad({ id: 'fake-id', filterApiLoad: ['test'] });
    expect(wrapper.text()).toEqual('Spinner');
    wrapper.unmount();
  });

  it('Can load partially', async() => {
    const wrapper = mount(GetterWrapper, {
      slots: { default: '<div class="getter-slot">slot for getter</div>' },
      propsData: {
        id: 'fake-id',
        apiLoad: [{ url: 'url/de/test', id: 'test', options: null }]
      }
    });
    await nextTick();
    wrapper.vm.forceLoad({ id: 'fake-id', loadType: 'partial' });
    await nextTick();
    // Keep content displayed instead of spinner while loading
    expect(wrapper.text()).toEqual('slot for getter');
    wrapper.unmount();
  });

  it('Handle errors', async() => {
    const wrapper = mount(GetterWrapper, {
      slots: { default: '<div class="getter-slot">slot for getter</div>' },
      propsData: { id: 'test', apiLoad: [{ url: 'url/de/test/error', id: 'test', options: null }] }
    });
    // Verify if ListErrors is displayed
    await sleep(100);
    expect(wrapper.text()).toEqual('ListErrors');
    wrapper.unmount();
  });

  it('Ignore error', async() => {
    const wrapper = mount(GetterWrapper, {
      slots: { default: '<div class="getter-slot">slot for getter</div>' },
      propsData: { id: 'test', apiLoad: [{ url: 'url/de/test/error', id: 'test', ignoreFail: true, options: null }] }
    });
    // Verify if ListErrors is NOT displayed
    await sleep(200);
    expect(wrapper.text()).toEqual('slot for getter');
    wrapper.unmount();
  });

  it('Handle no apiLoad', () => {
    const wrapper = mount(GetterWrapper, {
      slots: { default: '<div class="getter-slot">slot for getter</div>' },
      propsData: { id: 'test' }
    });
    // Verify if spinner is loading
    expect(wrapper.text()).toEqual('slot for getter');
    wrapper.unmount();
  });

  it('Handle invalid apiLoad', () => {
    const validator = GetterWrapper.props.apiLoad.validator;
    expect(validator([{ id: 'test', options: null }])).toBe(false);
  });
});
