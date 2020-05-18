<!--
 Copyright 2020 Coinbase, Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
-->

<template>
  <div id="bchaddress">
    <table class="table is-bordered is-striped" align="center">
      <thead>
        <th colspan="2">{{address}}</th>
      </thead>
      <tbody>
        <tr>
          <td>Balance</td><td>{{addressData['balance']}} BCH</td>
        </tr>
        <tr>
          <td>Satoshis</td><td>{{addressData['satoshis']}}</td>
        </tr>
        <tr>
          <td>Legacy Address</td><td>{{addressData['legacy']}}</td>
        </tr>
        <tr>
          <td>Confirmed Transactions</td><td>{{addressData['confirmed_transactions']}}</td>
        </tr>
        <tr>
          <td>Unconfirmed Transactions</td><td>{{addressData['unconfirmed_transactions']}}</td>
        </tr>
        <tr>
          <td>UTXOs</td><td>{{addressData['utxos']}}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'bchaddress',
  props: ['address', 'addressData'],
}
</script>
