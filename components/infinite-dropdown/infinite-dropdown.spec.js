import { describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import InfiniteDropdown from '@/components/infinite-dropdown/infinite-dropdown.vue';
import { nextTick } from 'vue';
import EventBus from '@/event-bus';

vi.mock('@/const', () => {
  return {
    PAGINATOR_EVENTS: { SEARCH: 'paginator::search' },
    INFINITE_DROPDOWN_EVENTS: { RESET: 'infinite-dropdown::reset' }
  };
});

const ITEM_0 = { id: '0', value: '0' };
const ITEM_1 = { id: '1', value: '1' };

const fakePaginatorItems = function(wrapper, spy) {
  return () => {
    // If spy required, trigger it
    if (spy) spy();
    // Set new items to wrapper
    wrapper.vm.items = [ITEM_0, ITEM_1];
    wrapper.vm.total = 2;
    // Fake emitting event to updateItems
    wrapper.vm.onUpdateItems();
  };
};

describe('InfiniteDropdown', () => {
  it('Get items on creation', async() => {
    const wrapper = shallowMount(InfiniteDropdown, { propsData: { route: '/route' } });
    // Fake getting elements on search
    EventBus.$on('paginator::search', fakePaginatorItems(wrapper));
    expect(wrapper.vm.items.length).toEqual(0);
    // Due to components stubs, manually init
    wrapper.vm.loadContainer();
    wrapper.vm.ready = true;
    await nextTick();

    expect(wrapper.vm.items.length).toEqual(2);

    EventBus.$off('paginator::search', fakePaginatorItems);
    wrapper.unmount();
  });

  it('Get items on focus if lazy', async() => {
    const wrapper = shallowMount(InfiniteDropdown, { propsData: { route: '/route', lazy: true } });
    const spy = vi.fn();
    // Fake getting elements on search
    EventBus.$on('paginator::search', fakePaginatorItems(wrapper, spy));
    expect(wrapper.vm.items.length).toEqual(0);
    // Due to components stubs, manually init
    wrapper.vm.loadContainer();
    wrapper.vm.ready = true;
    await nextTick();

    expect(spy).not.toHaveBeenCalled();
    expect(wrapper.vm.items.length).toEqual(0);

    // Focus in searchbar
    wrapper.vm.onFocus();
    await nextTick();
    expect(spy).toHaveBeenCalled();
    expect(wrapper.vm.items.length).toEqual(2);

    spy.mockClear();
    wrapper.vm.onFocus();
    await nextTick();
    // Get item trickered only once
    expect(spy).not.toHaveBeenCalled();

    EventBus.$off('paginator::search', fakePaginatorItems);
    wrapper.unmount();
  });

  it('Search with custom params and search', async() => {
    const wrapper = shallowMount(InfiniteDropdown, { propsData: { route: '/route', params: { filter: true } } });
    // Fake getting elements on search
    EventBus.$on('paginator::search', fakePaginatorItems(wrapper));
    // Due to components stubs, manually init
    wrapper.vm.loadContainer();
    wrapper.vm.ready = true;
    await nextTick();

    // Writting in searchbar
    wrapper.vm.onInput('search');
    await nextTick();
    expect(wrapper.vm.items.length).toEqual(2);
    expect(wrapper.vm.computedParams).toEqual({ filter: true, search: 'search' });

    EventBus.$off('paginator::search', fakePaginatorItems);
    wrapper.unmount();
  });

  it('Init localValue according to modelValue and type + watch', async() => {
    // MONO, init with null
    let wrapper = shallowMount(InfiniteDropdown, { propsData: { route: '/route', modelValue: null } });
    await nextTick();
    expect(wrapper.vm.localValue).toEqual(null);

    // Trigger watch to single item
    wrapper.setProps({ modelValue: ITEM_0 });
    await nextTick();
    expect(wrapper.vm.localValue).toEqual(ITEM_0);

    // Set empty value
    wrapper.setProps({ modelValue: null });
    await nextTick();
    expect(wrapper.vm.localValue).toEqual(null);

    wrapper.unmount();

    // MULTIPLE, init with null
    wrapper = shallowMount(InfiniteDropdown, { propsData: { route: '/route', multiple: true, modelValue: null } });
    await nextTick();
    expect(wrapper.vm.localValue).toEqual([]);

    // Set array
    wrapper.setProps({ modelValue: [ITEM_0] });
    await nextTick();
    expect(wrapper.vm.localValue).toEqual([ITEM_0]);

    // Set single item
    wrapper.setProps({ modelValue: ITEM_0 });
    await nextTick();
    expect(wrapper.vm.localValue).toEqual([ITEM_0]);

    // Set null
    wrapper.setProps({ modelValue: null });
    await nextTick();
    expect(wrapper.vm.localValue).toEqual([]);

    wrapper.unmount();

    // MULTIPLE, init with object
    wrapper = shallowMount(InfiniteDropdown, { propsData: { route: '/route', multiple: true, modelValue: ITEM_0 } });
    await nextTick();
    expect(wrapper.vm.localValue).toEqual([ITEM_0]);
    wrapper.unmount();

    // MULTIPLE, init with array
    wrapper = shallowMount(InfiniteDropdown, { propsData: { route: '/route', multiple: true, modelValue: [ITEM_0] } });
    await nextTick();
    expect(wrapper.vm.localValue).toEqual([ITEM_0]);
    wrapper.unmount();
  });

  it('Reset fields on event', async() => {
    const wrapper = shallowMount(InfiniteDropdown, { propsData: { id: 'myId', route: '/route' } });
    // Fake getting elements on search
    EventBus.$on('paginator::search', fakePaginatorItems(wrapper));
    // Due to components stubs, manually init
    wrapper.vm.loadContainer();
    wrapper.vm.ready = true;
    await nextTick();

    // Change result as if something changed after user interaction
    wrapper.vm.items = [ITEM_0];
    wrapper.vm.total = 1;

    // Try without id
    EventBus.$emit('infinite-dropdown::reset');
    await nextTick();
    // Not reseted
    expect(wrapper.vm.items.length).toEqual(1);
    expect(wrapper.vm.total).toEqual(1);

    // Try with a wrong id
    EventBus.$emit('infinite-dropdown::reset', { id: 'wrongId' });
    await nextTick();
    // Not reseted
    expect(wrapper.vm.items.length).toEqual(1);
    expect(wrapper.vm.total).toEqual(1);

    // Try with the right id
    EventBus.$emit('infinite-dropdown::reset', { id: 'myId' });
    await nextTick();
    // Doesn't reset if haven't search (default params) to avoid useless reload
    expect(wrapper.vm.items.length).toEqual(1);
    expect(wrapper.vm.total).toEqual(1);

    // Retry while search changed
    wrapper.vm.search = 'search';
    await nextTick();
    EventBus.$emit('infinite-dropdown::reset', { id: 'myId' });
    await nextTick();
    // Reseted to default values
    expect(wrapper.vm.items.length).toEqual(2);
    expect(wrapper.vm.total).toEqual(2);

    EventBus.$off('paginator::search', fakePaginatorItems);
    wrapper.unmount();
  });

  it('Parse items according to props', async() => {
    const wrapper = shallowMount(InfiniteDropdown, { propsData: { route: '/route', parse: (item) => item.id } });
    // Fake getting elements on search
    EventBus.$on('paginator::search', fakePaginatorItems(wrapper));
    // Due to components stubs, manually init
    wrapper.vm.loadContainer();
    wrapper.vm.ready = true;
    await nextTick();

    expect(wrapper.vm.items).toEqual(['0', '1']);

    EventBus.$off('paginator::search', fakePaginatorItems);
    wrapper.unmount();
  });
});
