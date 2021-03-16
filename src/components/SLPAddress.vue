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
  <div id="slpaddress">
    <h2 v-if="tokens.length">SLP Balances and Token Metadata</h2>
    <div v-for="(token, index) in tokens" :key="index">
      <table class="table is-bordered is-striped" align="center">
        <tbody>
          <tr>
            <td>Balance</td>
            <td>{{token.balance.div(10**token.decimals).toFixed()}} {{token.token_metadata.ticker}}</td>
          </tr>
          <tr>
            <td>Name</td>
            <td>{{token.token_metadata.name}}</td>
          </tr>
          <tr>
            <td>Token ID</td>
            <td>{{token.token_id}}</td>
          </tr>
          <tr>
            <td>Document URL</td>
            <td>{{token.token_metadata.document_url}}</td>
          </tr>
          <tr>
            <td>Document Hash</td>
            <td>{{token.token_metadata.document_hash}}</td>
          </tr>
          <tr v-if="token.token_metadata.nft_group_id">
            <td>NFT Group</td>
            <td>{{token.token_metadata.nft_group_id}}</td>
          </tr>
          <tr v-else>
            <td>Current Mint Baton Location</td>
            <td>{{token.token_metadata.mint_baton_vout ? `${token.token_metadata.mint_baton_txid}:${token.token_metadata.mint_baton_vout}` : "NA"}}</td>
          </tr>
        </tbody>
      </table>
      <br>
    </div>
  </div>
</template>

<script>
export default {
  name: "slpaddress",
  props: ["tokens"]
};
</script>