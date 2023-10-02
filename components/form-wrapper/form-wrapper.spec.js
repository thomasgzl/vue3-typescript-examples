import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import FormWrapper from '@/components/form-wrapper/form-wrapper.vue';
import EventBus from '@/event-bus';
import { nextTick, h } from 'vue';
import { setActivePinia, createPinia, defineStore } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

let lastUrlCalled = null;
const mockBtnMultiStates = h('button', 'BtnMultiStates');
const mockListErrors = h('div', 'ListErrors');
const mockSpinner = h('svg', 'Spinner');
vi.mock('@/components/btn-multi-states/btn-multi-states.vue', () => {
  return { default: { render: () => mockBtnMultiStates }, __esModule: vi.fn() };
});
vi.mock('@/components/list-errors/list-errors.vue', () => {
  return { default: { render: () => mockListErrors }, __esModule: vi.fn() };
});
vi.mock('@/components/spinner/spinner.vue', () => {
  return { default: { render: () => mockSpinner }, __esModule: vi.fn() };
});
vi.mock('@/utils/animate', () => {
  return { animateCSS: () => true };
});
vi.mock('@/utils/i18n', () => {
  return {
    i18n: {
      t: (params) => {
        return params;
      }
    }
  };
});
function mockApi(url) {
  url = url.toString();
  lastUrlCalled = url;
  if (url.includes('449')) {
    throw new (function(message) {
      this.message = message;
      this.response = { status: 449 };
    })('error');
  } else if (url.includes('/error')) {
    throw new Error('error');
  } else {
    return true;
  }
}
vi.mock('@/http', () => {
  return { default: vi.fn().mockImplementation(mockApi) };
});

const FORM_WRAPPER_EVENTS = {
  SUBMIT: 'form-wrapper::submit',
  UPDATE: 'form-wrapper::update',
  CLEAR_ERRORS: 'form-wrapper::clear-errors'
};

export const useUserStore = defineStore('user', {
  state: function() {
    return { token: 'eytoto' };
  }
});

describe('FormWrapper', () => {
  beforeEach(() => {
    // creates a fresh pinia and make it active so it's automatically picked
    // up by any useStore() call without having to pass it to it:
    // `useStore(pinia)`
    setActivePinia(createPinia());
  });
  it('Form Slot', () => {
    const userStore = useUserStore();
    const wrapper = mount(FormWrapper, {
      propsData: { id: 'test', routesSave: [{ apiSave: '', postData: vi.fn() }] },
      slots: { default: '<div class="form-slot">slot for form</div>' },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        mocks: { userStore }
      }
    });
    // Verify if form is here
    expect(wrapper.find('.form-slot').exists()).toBe(true);
    wrapper.unmount();
  });

  it('Validate routesSave props', () => {
    let spy = false;
    vi.spyOn(console, 'warn').mockImplementation(() => {
      spy = true;
    });
    let wrapper = mount(FormWrapper, { propsData: { id: 'test', routesSave: ['error'] } });
    expect(spy).toBeTruthy();
    spy = false;
    wrapper.unmount();

    wrapper = mount(FormWrapper, { propsData: { id: 'test', routesSave: [{ apiSave: '/route', postData: vi.fn(), httpMethod: 'error' }] } });
    expect(spy).toBeTruthy();
    spy = false;
    wrapper.unmount();

    wrapper = mount(FormWrapper, { propsData: { id: 'test', routesSave: [{ apiSave: '/route', postData: vi.fn(), httpMethod: 'post' }] } });
    expect(spy).toBeFalsy();
    wrapper.unmount();

    wrapper = mount(FormWrapper, { propsData: { id: 'test', routesSave: [{ apiSave: '/route', postData: vi.fn(), id: {} }] } });
    expect(spy).toBeTruthy();
    spy = false;
    wrapper.unmount();

    wrapper = mount(FormWrapper, { propsData: { id: 'test', routesSave: [{ apiSave: '/route', postData: vi.fn(), id: 'id' }] } });
    expect(spy).toBeFalsy();
    wrapper.unmount();
  });

  it('Submit', async function() {
    let wrapper = mount(FormWrapper, {
      propsData: {
        id: 'fake-id',
        routesSave: [{ apiSave: '', postData: vi.fn() }],
        state: 'success',
        vuelidate: { $touch: vi.fn(), $invalid: true }
      }
    });

    let spy = '??';
    EventBus.$on(FORM_WRAPPER_EVENTS.UPDATE, (e) => {
      if (e.id === 'fake-id') {
        spy = e.state;
      }
    });
    await wrapper.vm.forceSubmit({ id: 'wrong-id' });
    expect(spy).toBe('??');
    await wrapper.vm.forceSubmit({ id: 'fake-id', options: { bypassValidation: false } });
    expect(spy).toBe('invalid');
    wrapper.unmount();

    wrapper = mount(FormWrapper, {
      propsData: {
        id: 'fake-id',
        routesSave: [{ apiSave: 'http://test.com', postData: vi.fn() }],
        state: 'success',
        vuelidate: { $touch: vi.fn(), $invalid: true }
      }
    });
    await wrapper.vm.forceSubmit({ id: 'fake-id', options: { bypassValidation: true } });
    expect(spy).toBe('success');
    spy = '??';
    wrapper.setProps({ locked: true });
    await nextTick();
    await wrapper.vm.save();
    expect(spy).toBe('??');

    wrapper.unmount();
  });

  it('Save loading/success', async function() {
    const wrapper = mount(FormWrapper, { propsData: { id: 'test', routesSave: [{ apiSave: 'http://test.com', postData: vi.fn() }] } });

    // Initialize meta value
    import.meta.env.VITE_API_URL = 'http://test.com';

    let spy = '??';
    EventBus.$on(FORM_WRAPPER_EVENTS.UPDATE, (e) => {
      spy = e.state;
    });
    await wrapper.vm.save();
    expect(spy).toBe('success');

    // Can save without a complete url (concatenate)
    wrapper.setProps({ routesSave: [{ apiSave: '/route', postData: vi.fn() }] });
    await nextTick();
    spy = '??';
    EventBus.$on(FORM_WRAPPER_EVENTS.UPDATE, (e) => {
      spy = e.state;
    });
    await wrapper.vm.save();
    await nextTick();
    expect(spy).toBe('success');

    wrapper.unmount();
  });

  it('Save error', async function() {
    const wrapper = mount(FormWrapper, { propsData: { id: 'test', routesSave: [{ apiSave: 'http://test.com/error', postData: vi.fn() }] } });
    // Temporary disable console.error (to avoid display in test results)
    const originalError = console.error;
    console.error = vi.fn();

    let spy = '??';
    EventBus.$on(FORM_WRAPPER_EVENTS.UPDATE, (e) => {
      spy = e.state;
    });
    await wrapper.vm.save();
    expect(spy).toBe('error');

    expect(wrapper.vm.saveError).not.toBe(null);

    EventBus.$emit(FORM_WRAPPER_EVENTS.CLEAR_ERRORS, { id: 'invalid' });
    await nextTick();
    expect(wrapper.vm.saveError).not.toBe(null);

    EventBus.$emit(FORM_WRAPPER_EVENTS.CLEAR_ERRORS, { id: 'test' });
    await nextTick();
    expect(wrapper.vm.saveError).toBe(null);

    // Reenable console.error
    console.error = originalError;
    wrapper.unmount();
  });

  it('Save invalid', async function() {
    const wrapper = mount(FormWrapper, { propsData: { id: 'test', routesSave: [{ apiSave: '', postData: vi.fn() }], invalid: true } });
    let spy = '??';
    EventBus.$on(FORM_WRAPPER_EVENTS.UPDATE, (e) => {
      spy = e.state;
    });
    await wrapper.vm.save();
    expect(spy).toBe('invalid');

    wrapper.unmount();
  });

  it('Lock unlock', async() => {
    let wrapper = mount(FormWrapper, {
      // no lock init
      propsData: { id: 'test', routesSave: [{ apiSave: '', postData: vi.fn() }] },
      slots: {
        default: `<div>
      <button>btn</button>
      <input/>
      <button data-locked-enable>enable</button>
      <button data-locked-visible>visible</button>
      </div>`
      }
    });

    expect(wrapper.vm.locked).toBe(false);
    wrapper.setProps({ locked: true });
    await nextTick();
    expect(wrapper.vm.locked).toBe(true);
    expect(wrapper.find('button[disabled]').exists()).toBe(true);
    expect(wrapper.find('button[data-locked-enable][disabled]').exists()).toBe(false);
    wrapper.setProps({ locked: false });
    await nextTick();
    expect(wrapper.vm.locked).toBe(false);

    wrapper.unmount();

    // locked init
    wrapper = mount(FormWrapper, {
      propsData: { id: 'test', locked: true, routesSave: [{ apiSave: '', postData: vi.fn() }] },
      slots: {
        default: `<div>
      <button id="btn1">btn</button>
      <input/>
      <button id="btn2" disabled>disable</button>
      <button id="btn3" data-unlock-ignore>disabled</button>
      </div>`
      }
    });

    expect(wrapper.vm.locked).toBe(true);
    expect(wrapper.find('#btn1[disabled]').exists()).toBe(true);
    expect(wrapper.find('#btn2[disabled]').exists()).toBe(true);
    expect(wrapper.find('#btn3[disabled]').exists()).toBe(true);
    wrapper.setProps({ locked: false });
    await nextTick();
    expect(wrapper.vm.locked).toBe(false);
    expect(wrapper.find('#btn1[disabled]').exists()).toBe(false);
    expect(wrapper.find('#btn2[disabled]').exists()).toBe(false);
    expect(wrapper.find('#btn3[disabled]').exists()).toBe(true);

    // no autoLockChild
    wrapper = mount(FormWrapper, {
      propsData: {
        id: 'test',
        locked: true,
        autoLockChild: false,
        routesSave: [{ apiSave: '', postData: vi.fn() }]
      },
      slots: {
        default: `<div>
      <button id="btn1">btn</button>
      <button id="btn2" disabled>btn</button>
      </div>`
      }
    });
    await nextTick();
    expect(wrapper.vm.locked).toBe(true);
    expect(wrapper.find('#btn1[disabled]').exists()).toBe(false);
    expect(wrapper.find('#btn2[disabled]').exists()).toBe(true);
    wrapper.setProps({ locked: false });
    await nextTick();
    expect(wrapper.find('#btn1[disabled]').exists()).toBe(false);
    expect(wrapper.find('#btn2[disabled]').exists()).toBe(true);

    wrapper.unmount();
  });

  it('Handles http code 449 confirmation', async function() {
    let wrapper = mount(FormWrapper, { propsData: { id: 'test', routesSave: [{ apiSave: 'http://test.com/error/449', postData: vi.fn() }] } });
    // Temporary disable console.error (to avoid display in test results)
    const originalError = console.error;
    console.error = vi.fn();

    expect(wrapper.vm.confirmation).toBe(false);
    await wrapper.vm.save();
    expect(wrapper.vm.confirmation).toBe(true);
    expect(lastUrlCalled.includes('?force=true')).toBe(false);
    await wrapper.vm.save();
    expect(lastUrlCalled.includes('?force=true')).toBe(true);
    wrapper.unmount();

    wrapper = mount(FormWrapper, { propsData: { id: 'test', routesSave: [{ apiSave: 'http://test.com/error/449?arg=true', postData: vi.fn() }] } });
    await wrapper.vm.save();
    expect(lastUrlCalled.includes('&force=true')).toBe(false);
    await wrapper.vm.save();
    expect(lastUrlCalled.includes('&force=true')).toBe(true);

    // Reenable console.error
    console.error = originalError;
    wrapper.unmount();
  });
});
