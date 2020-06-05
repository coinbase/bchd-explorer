/**
 * Copyright 2020 Coinbase, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import BCHDExplorer from '@/components/BCHDExplorer.vue'
import { mount, createLocalVue } from '@vue/test-utils'
import VueRouter from 'vue-router'

describe('BCHDExplorer.vue', () => {
  it('renders an error when the input is invalid', done => {
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    const router = new VueRouter()

    const wrapper = mount(BCHDExplorer, {
      localVue,
      router,
      data() {
        return {
          getInfoBar: false
        }
      }
    })
    wrapper.find('.input').setValue('bad');

    wrapper.vm.search().then(function () {
      expect(wrapper.vm.$data.input).toMatch("bad");
      done();
    });
  });

  it('renders an address', done => {
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    const router = new VueRouter()

    const wrapper = mount(BCHDExplorer, {
      localVue,
      router,
      data() {
        return {
          getInfoBar: false
        }
      }
    })
    wrapper.find('.input').setValue('bitcoincash:qrhea03074073ff3zv9whh0nggxc7k03ssh8jv9mkx');

    wrapper.vm.search().then(function () {
      expect(wrapper.vm.$data.input).toMatch("bitcoincash:qrhea03074073ff3zv9whh0nggxc7k03ssh8jv9mkx");
      done();
    });
  });

  it('renders a block by height', done => {
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    const router = new VueRouter()

    const wrapper = mount(BCHDExplorer, {
      localVue,
      router,
      data() {
        return {
          getInfoBar: false
        }
      }
    })
    wrapper.find('.input').setValue('632707');

    wrapper.vm.search().then(function () {
      expect(wrapper.vm.$data.input).toMatch("632707");
      done();
    });
  });

  it('renders a block by hash', done => {
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    const router = new VueRouter()

    const wrapper = mount(BCHDExplorer, {
      localVue,
      router,
      data() {
        return {
          getInfoBar: false
        }
      }
    })
    wrapper.find('.input').setValue('0000000000000000031de8bfa6e1d344339df7fa657804e06927f20e30c1eed0');

    wrapper.vm.search().then(function () {
      expect(wrapper.vm.$data.input).toMatch("0000000000000000031de8bfa6e1d344339df7fa657804e06927f20e30c1eed0");
      done();
    });
  });
})
