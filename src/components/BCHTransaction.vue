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
        <tr v-if="transactionData['slp_action'] > 0">
          <td>SLP Validity</td>
          <td>{{transactionData['slp_valid'] ? "Valid" : "Invalid"}}</td>
        </tr>
        <tr v-if="transactionData['slp_action'] > 2">
          <td>SLP Type</td>
          <td>{{transactionData['slp_action_str']}}</td>
        </tr>
        <tr v-if="[1,2].includes(transactionData['slp_action'])">
          <td>SLP Error Type</td>
          <td>{{transactionData['slp_action_str']}}</td>
        </tr>
        <tr v-if="transactionData['slp_action'] === 2" style="color:red;">
          <td>SLP Parser Error</td>
          <td>{{transactionData['slp_parse_error']}}</td>
        </tr>
        <tr v-else-if="transactionData['slp_action'] > 2 && !transactionData['slp_valid']"  style="color:red;">
          <td>SLP Error</td>
          <td>Insufficient inputs</td>
        </tr>
        <tr v-if="transactionData['token_metadata']">
          <td>SLP Token Name</td>
          <td>{{transactionData['token_metadata'].name}}</td>
        </tr>
        <tr v-if="transactionData['token_metadata']">
          <td>SLP Token ID</td>
          <td>{{transactionData['token_metadata'].token_id}}</td>
        </tr>
        <tr v-if="transactionData['burn_flags']" style="color:red;">
          <td>SLP Burns</td>
          <td>{{transactionData['burn_flags']}}</td>
        </tr>
        <tr v-if="transactionData['burn_amt_this_token']" style="color:red;">
          <td>SLP Inputs Burned (this token)</td>
          <td>{{`${transactionData['burn_amt_this_token']} ${transactionData.token_metadata.ticker}`}}</td>
        </tr>
        <tr v-if="transactionData['burns_from_other_tokens']" style="color:red;">
          <td>SLP Inputs Burned (misc. tokens)</td>
          <td>See inputs below</td>
        </tr>
        <tr v-if="transactionData['slp_action'] === 1">
          <td>SLP Parsing Error</td>
          <td>{{transactionData['slp_parse_error']}}</td>
        </tr>
        <tr v-if="transactionData['token_metadata'] && [10,11].includes(transactionData['slp_action'])">
          <td>SLP Group ID</td>
          <td>{{transactionData['token_metadata'].nft_group_id}}</td>
        </tr>
        <tr>
          <td>Version</td>
          <td>{{transactionData['version']}}</td>
        </tr>
        <tr>
          <td>Lock Time</td>
          <td>{{transactionData['lock_time']}}</td>
        </tr>
        <tr>
          <td>Size</td>
          <td>{{transactionData['size']}}</td>
        </tr>
        <tr>
          <td>Timestamp</td>
          <td>{{transactionData['timestamp']}}</td>
        </tr>
        <tr>
          <td>Confirmations</td>
          <td>{{transactionData['confirmations']}}</td>
        </tr>
        <tr>
          <td>Block Height</td>
          <td>{{transactionData['block_height']}}</td>
        </tr>
        <tr>
          <td>Block Hash</td>
          <td>{{transactionData['block_hash']}}</td>
        </tr>
      </tbody>
    </table>
    <h2 v-if="transactionData['inputs'].length === 1">1 Txn Input</h2>
    <h2 v-else>{{transactionData['inputs'].length}} Txn Inputs</h2>
    <table
      class="table is-bordered is-striped"
      align="center"
      v-for="item in transactionData['inputs']"
      v-bind:key="item.id"
    >
      <tbody>
        <tr>
          <td>Input index</td>
          <td>{{item.getIndex()}}</td>
        </tr>
        <tr v-if="item.token">
          <td>SLP Token</td>
          <td v-if="!item.token.isBurned">{{item.token.isMintBaton ? "MINT BATON": item.token.amount}} {{item.token.isMintBaton ? "" : item.token.ticker}}</td>
          <td v-else style="color:red;">{{item.token.isMintBaton ? "MINT BATON": item.token.amount}} {{item.token.ticker}} BURNED</td>
        </tr>
        <tr v-if="item.token && item.token.isBurned">
          <td>SLP Token ID Burned</td>
          <td style="color:red;">{{item.token.token_id}}</td>
        </tr>
        <tr>
          <td>Outpoint Hash</td>
          <td>{{convertHash(item.getOutpoint().getHash())}}</td>
        </tr>
        <tr>
          <td>Outpoint Index</td>
          <td>{{item.getOutpoint().getIndex()}}</td>
        </tr>
        <tr>
          <td>Signature Script</td>
          <td>{{viewScript(item.getSignatureScript_asU8())}}</td>
        </tr>
        <tr>
          <td>Sequence</td>
          <td>{{item.getSequence()}}</td>
        </tr>
        <tr>
          <td>Value</td>
          <td>{{item.getValue()}}</td>
        </tr>
        <tr>
          <td>Previous Script</td>
          <td>{{viewScript(item.getPreviousScript_asU8())}}</td>
        </tr>
        <tr>
          <td>Address</td>
          <td>{{item.getAddress()}}</td>
        </tr>
      </tbody>
    </table>
    <h2 v-if="transactionData['outputs'].length === 1">1 Txn Output</h2>
    <h2 v-else>{{transactionData['outputs'].length}} Txn Outputs</h2>
    <table
      class="table is-bordered is-striped"
      align="center"
      v-for="item in transactionData['outputs']"
      v-bind:key="item.id"
    >
      <tbody>
        <tr>
          <td>Output index</td>
          <td>{{item.getIndex()}}</td>
        </tr>
        <tr v-if="item.token">
          <td>SLP Token</td>
          <td>{{item.token.isMintBaton ? "MINT BATON" : item.token.amount}} {{item.token.isMintBaton ? "" : transactionData.token_metadata.ticker}}</td>
        </tr>
        <tr>
          <td>BCH Satoshis</td>
          <td>{{item.getValue()}}</td>
        </tr>
        <tr>
          <td>Pubkey Script</td>
          <td>{{viewScript(item.getPubkeyScript_asU8())}}</td>
        </tr>
        <tr>
          <td>Address</td>
          <td>{{item.getAddress()}}</td>
        </tr>
        <tr>
          <td>Script Class</td>
          <td>{{item.getScriptClass()}}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: "bchtransaction",
  props: ["transaction", "transactionData"],
  methods: {
    convertHash: function(bytes) {
      return Array.from(bytes, function(byte) {
        return ("0" + (byte & 0xff).toString(16)).slice(-2);
      })
        .reverse()
        .join("");
    },
    viewScript: function(bytes) {
      return Buffer.from(bytes).toString("hex");
    }
  }
};
</script>