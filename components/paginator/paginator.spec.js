import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Paginator from '@/components/paginator/paginator.vue';
import { h, nextTick } from 'vue';
import { sleep } from './helpers/utils';
import { setActivePinia, createPinia, defineStore } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import EventBus from '@/event-bus';

const mockSpinner = h('svg', 'Spinner');
vi.mock('@/components/spinner/spinner.vue', () => {
  return { default: { render: () => mockSpinner }, __esModule: vi.fn() };
});

function mockApi(options) {
  if (options.url.includes('/success')) {
    return {
      data: {
        items: [
          { id: '0', value: '0' },
          { id: '1', value: '1' }
        ],
        total: 2,
        page: 1
      }
    };
  } else if (options.url.includes('/error')) {
    throw new Error('error');
  } else if (options.url.includes('/paginated')) {
    if (options.params.page === 1) {
      return { data: { items: [{ id: '0', value: '0' }], total: 2, page: 1 } };
    } else {
      return { data: { items: [{ id: '1', value: '1' }], total: 2, page: 2 } };
    }
  } else {
    return null;
  }
}
vi.mock('@/http', () => {
  return { default: vi.fn().mockImplementation(mockApi) };
});

export const useUserStore = defineStore('user', {
  state: function() {
    return { token: 'eytoto' };
  }
});

describe('Paginator', () => {
  beforeEach(() => {
    // creates a fresh pinia and make it active so it's automatically picked
    // up by any useStore() call without having to pass it to it:
    // `useStore(pinia)`
    setActivePinia(createPinia());
  });
  it('Get data from url', async() => {
    const userStore = useUserStore();
    const wrapper = mount(Paginator, {
      propsData: { url: '/success', id: 'myId' },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        mocks: { userStore }
      }
    });
    // When mounted, nothing displayed, nothing was fetched.
    expect(wrapper.text()).toEqual('');

    // If trying to search with wrong id
    wrapper.vm.search({ id: 'wrongId' });
    await nextTick();
    // Nothing happened
    expect(wrapper.emitted()['update:items']).not.toBeTruthy();

    // Searching without id
    wrapper.vm.search();
    await nextTick();
    // Nothing happened
    expect(wrapper.emitted()['update:items']).not.toBeTruthy();

    // Searching with correct id
    wrapper.vm.search({ id: 'myId' });
    await nextTick();
    // Wait for the debounce to operate
    await sleep(300);

    // Expect success data items updated
    expect(wrapper.emitted()['update:items'][0][0]).toEqual([
      { id: '0', value: '0' },
      { id: '1', value: '1' }
    ]);

    wrapper.unmount();
  });

  it('Handle no response from get', async() => {
    // Yes, httpMethod and contentType are pure coverage
    const userStore = useUserStore();
    const wrapper = mount(Paginator, {
      propsData: { url: '/empty', id: 'myId', httpMethod: 'post', contentType: 'application/x-www-form-urlencoded' },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        mocks: { userStore }
      }
    });
    wrapper.vm.search({ id: 'myId' });
    await sleep(300);
    // Empty event emitted if no content
    expect(wrapper.emitted()['update:items'][0][0]).toEqual([]);
    wrapper.unmount();
  });

  it('Handle error on get', async() => {
    const userStore = useUserStore();
    const wrapper = mount(Paginator, {
      propsData: { url: '/error', id: 'myId' },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        mocks: { userStore }
      }
    });
    // Temporary disable console.error (to avoid display in test results)
    const originalError = console.error;
    console.error = vi.fn();

    expect(wrapper.emitted()['error']).not.toBeTruthy();
    wrapper.vm.search({ id: 'myId' });
    await sleep(300);
    // An error event has been emitted
    expect(wrapper.emitted()['error'].length).toEqual(1);

    // Reenable console.error
    console.error = originalError;

    wrapper.unmount();
  });

  it('Get more items when scrolling down', async() => {
    const userStore = useUserStore();
    const wrapper = mount(Paginator, {
      propsData: { url: '/paginated', id: 'myId', pageSize: 1 },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        mocks: { userStore }
      }
    });
    wrapper.vm.search({ id: 'myId' });
    await sleep(300);

    // Only one element
    expect(wrapper.emitted()['update:page'].length).toEqual(1);
    expect(wrapper.emitted()['update:items'].length).toEqual(1);
    expect(wrapper.emitted()['update:items'][0][0]).toEqual([{ id: '0', value: '0' }]);

    // Due to models not updating automatically, we force update here
    wrapper.setProps({ page: 2, items: [{ id: '0', value: '0' }] });
    await nextTick();

    // Not scrolling enough, doesn't trigger anything
    // Faking scroll
    wrapper.vm.onScroll({ target: { scrollTop: 0, offsetHeight: 1, scrollHeight: 1 } });
    await nextTick();
    await sleep(500);
    expect(wrapper.emitted()['update:page'].length).toEqual(1);
    expect(wrapper.emitted()['update:items'].length).toEqual(1);

    // Faking scroll
    wrapper.vm.onScroll({ target: { scrollTop: 2, offsetHeight: 1, scrollHeight: 1 } });
    await nextTick();
    await sleep(500);

    expect(wrapper.emitted()['update:page'].length).toEqual(2);
    expect(wrapper.emitted()['update:items'].length).toEqual(2);
    expect(wrapper.emitted()['update:items'][1][0]).toEqual([
      { id: '0', value: '0' },
      { id: '1', value: '1' }
    ]);

    wrapper.setProps({
      page: 3,
      items: [
        { id: '0', value: '0' },
        { id: '1', value: '1' }
      ]
    });
    await nextTick();

    // Scrolling without needing more elements doesn't start request
    wrapper.vm.onScroll({ target: { scrollTop: 2, offsetHeight: 1, scrollHeight: 1 } });
    await nextTick();
    await sleep(500);
    expect(wrapper.emitted()['update:page'].length).toEqual(2);
    expect(wrapper.emitted()['update:items'].length).toEqual(2);

    wrapper.unmount();
  });

  it('Get handle error when scrolling down', async() => {
    const userStore = useUserStore();
    const wrapper = mount(Paginator, {
      propsData: {
        url: '/error',
        id: 'myId',
        pageSize: 1,
        page: 2,
        items: [{ id: '0', value: '0' }]
      },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        mocks: { userStore }
      }
    });
    // Temporary disable console.error (to avoid display in test results)
    const originalError = console.error;
    console.error = vi.fn();

    wrapper.vm.onScroll({ target: { scrollTop: 2, offsetHeight: 1, scrollHeight: 1 } });
    await nextTick();
    await sleep(500);

    // It reset items
    expect(wrapper.emitted()['update:items'][0][0]).toEqual([]);
    expect(wrapper.emitted()['error'].length).toEqual(1);

    // Reenable console.error
    console.error = originalError;
    wrapper.unmount();
  });

  it('Cancel previous request', async() => {
    const wrapper = mount(Paginator, {
      propsData: {
        url: '/cancel',
        id: 'myId',
        pageSize: 1,
        page: 1,
        items: [{ id: '0', value: '0' }]
      }
    });

    const spy = vi.spyOn(wrapper.vm.getItemsDebounced, 'cancel');

    EventBus.$emit('paginator::cancel-previous-request', { id: 'invalidId' });
    EventBus.$emit('paginator::cancel-previous-request');
    await nextTick();
    expect(spy).not.toHaveBeenCalled();

    EventBus.$emit('paginator::cancel-previous-request', { id: 'myId' });
    await nextTick();
    expect(spy).toHaveBeenCalled();
  });
});
