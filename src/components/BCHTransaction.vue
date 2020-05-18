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
  <div id="bchtransaction">
    <table class="table is-bordered is-striped" align="center">
      <thead>
        <th colspan="2">{{transaction}}</th>
      </thead>
      <tbody>
        <tr>
          <td>Version</td><td>{{transactionData['version']}}</td>
        </tr>
        <tr>
          <td>Lock Time</td><td>{{transactionData['lock_time']}}</td>
        </tr>
        <tr>
          <td>Size</td><td>{{transactionData['size']}}</td>
        </tr>
        <tr>
          <td>Timestamp</td><td>{{transactionData['timestamp']}}</td>
        </tr>
        <tr>
          <td>Confirmations</td><td>{{transactionData['confirmations']}}</td>
        </tr>
        <tr>
          <td>Block Height</td><td>{{transactionData['block_height']}}</td>
        </tr>
        <tr>
          <td>Block Hash</td><td>{{transactionData['block_hash']}}</td>
        </tr>
      </tbody>
    </table>
    <h2>Inputs</h2>
    <table class="table is-bordered is-striped" align="center" v-for="item in transactionData['inputs']" v-bind:key="item.id">
      <tbody>
        <tr>
          <td>Index</td><td>{{item.getIndex()}}</td>
        </tr>
        <tr>
          <td>Outpoint Hash</td><td>{{convertHash(item.getOutpoint().getHash())}}</td>
        </tr>
        <tr>
          <td>Outpoint Index</td><td>{{item.getOutpoint().getIndex()}}</td>
        </tr>
        <tr>
          <td>Signature Script</td><td>{{viewScript(item.getSignatureScript_asU8())}}</td>
        </tr>
        <tr>
          <td>Sequence</td><td>{{item.getSequence()}}</td>
        </tr>
        <tr>
          <td>Value</td><td>{{item.getValue()}}</td>
        </tr>
        <tr>
          <td>Previous Script</td><td>{{viewScript(item.getPreviousScript_asU8())}}</td>
        </tr>
        <tr>
          <td>Address</td><td>{{item.getAddress()}}</td>
        </tr>
      </tbody>
    </table>
    <h2>Outputs</h2>
    <table class="table is-bordered is-striped" align="center" v-for="item in transactionData['outputs']" v-bind:key="item.id">
      <tbody>
        <tr>
          <td>Index</td><td>{{item.getIndex()}}</td>
        </tr>
        <tr>
          <td>Value</td><td>{{item.getValue()}}</td>
        </tr>
        <tr>
          <td>Pubkey Script</td><td>{{viewScript(item.getPubkeyScript_asU8())}}</td>
        </tr>
        <tr>
          <td>Address</td><td>{{item.getAddress()}}</td>
        </tr>
        <tr>
          <td>Script Class</td><td>{{item.getScriptClass()}}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'bchtransaction',
  props: ['transaction', 'transactionData'],
  methods: {
    convertHash: function (bytes) {
      return Array.from(bytes, function(byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
      }).reverse().join('');
    },
    viewScript: function(bytes) {
      return(Buffer.from(bytes).toString('hex'));
    },
  }
}
</script>
