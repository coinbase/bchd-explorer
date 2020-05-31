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

import Vue from 'vue';
import App from './App.vue';
import VueRouter from 'vue-router';
import BCHDExplorer from './components/BCHDExplorer.vue';

Vue.config.productionTip = false;

Vue.use(VueRouter)
const router = new VueRouter({
  mode: 'history',
  routes: [
    {name: 'home', path: '/', component: BCHDExplorer},
    {name: 'mainnet/address', path: '/mainnet/address/:address', component: BCHDExplorer},
    {name: 'testnet/address', path: '/testnet/address/:address', component: BCHDExplorer},
    {name: 'mainnet/block', path: '/mainnet/block/:blockHash', component: BCHDExplorer},
    {name: 'testnet/block', path: '/testnet/block/:blockHash', component: BCHDExplorer},
    {name: 'mainnet/tx', path: '/mainnet/tx/:txId', component: BCHDExplorer},
    {name: 'testnet/tx', path: '/testnet/tx/:txId', component: BCHDExplorer},
  ]
})

new Vue({
  router,
  render: h => h(App),
}).$mount('#app');
