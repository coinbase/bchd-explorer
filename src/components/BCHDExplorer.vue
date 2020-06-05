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
  <div class="explorer">
    <section class="section">
      <div class="container has-text-right">
        <input type="checkbox" id="checkbox" v-model="testnet" v-on:change="updateNetwork()">
        &nbsp;<label for="checkbox">Testnet</label>
      </div>
      <div class="container">
        <img class="logo" src="../assets/bchd-explorer.svg">
        <div class="field">
          <div class="control has-icons-left">
            <input class="input is-primary"
              type="text"
              v-model="input"
              :autofocus="'autofocus'" autocomplete="off"
              placeholder="Address, transaction or block hash/height"
              @keyup.enter="search">
            <span class="icon is-small is-left">
              <i class="fas fa-search"></i>
            </span>
          </div>
        </div>
      </div>
      <div class="info-result container has-text-centered info-result">
        {{infoResult}}
      </div>
      <div class="container results has-text-centered" v-show="result.length" v-cloak>
        <strong>{{result}}</strong>
      </div>
      <div class="container results" v-show="address.length" v-cloak>
        <BCHAddress :address="address" :addressData="addressData" />
      </div>
      <div class="container results" v-show="block.length" v-cloak>
        <BCHBlock :block="block" :blockData="blockData" />
      </div>
      <div class="container results" v-show="transaction.length" v-cloak>
        <BCHTransaction :transaction="transaction" v-bind:transactionData="transactionData" />
      </div>
    </section>
    <footer class="has-text-centered">Copyright &copy; 2020 Coinbase — All rights reserved.</footer>
  </div>
</template>

<script>
import {GrpcClient} from 'grpc-bchrpc-web';
import bchaddr from 'bchaddrjs';
import BCHAddress from './BCHAddress.vue';
import BCHBlock from './BCHBlock.vue';
import BCHTransaction from './BCHTransaction.vue';
import sb from 'satoshi-bitcoin';
import prettyBytes from 'pretty-bytes';

const TESTNET = 'testnet'
const MAINNET = 'mainnet'

export default {
  name: 'explorer',
  components: {
    BCHAddress,
    BCHBlock,
    BCHTransaction,
  },
  data: function() {
    return {
      result: "",
      infoResult: " ",
      input: "",
      grpc: new GrpcClient({testnet: this.testnet}),
      testnet: false,
      address: "",
      addressData: this.defaultAddressData(),
      transaction: "",
      transactionData: this.defaultTransactionData(),
      block: "",
      blockData: this.defaultBlockData(),
      getInfoBar: true,
    };
  },
  mounted() {
    this.testnet = this.$route.params.network === TESTNET
    this.updateNetwork()

    const params = this.$route.params
    const input = params.address || params.blockHash || params.txId

    if (input != undefined) {
      this.searchBCHD(input)
    }
  },
  watch: {
    $route(to) {
      this.testnet = to.params.network === TESTNET
      this.updateNetwork()

      this.input = ""
      const input = to.params.address || to.params.blockHash || to.params.txId

      if (input != undefined) {
        this.searchBCHD(input)
      }
    }
  },
  methods: {
    search: async function() {
      this.searchBCHD(this.input)
    },
    searchBCHD: async function(input) {
      this.resetState();

      if (input == "") {
        this.$router.push({name: 'home'}).catch(() => {})
        return;
      }

      if (bchaddr.isValidAddress(input)) {
        var addr = bchaddr.toCashAddress(input);
        await this.populateAddressData(addr);
        this.$router.push({
          name: 'address',
          params: {
            network: this.determineNetwork(),
            address: input
          }
        }).catch(() => {})
        return;
      }

      var blockData = await this.populateBlockData(input);
      if (blockData === true) {
        this.$router.push({
          name: 'block',
          params: {
            network: this.determineNetwork(),
            blockHash: input
          }
        }).catch(() => {})
        return;
      }

      var transactionData = await this.populateTransactionData(input);
      if (transactionData === true) {
        this.$router.push({
          name: 'tx',
          params: {
            network: this.determineNetwork(),
            txId: input
          }
        }).catch(() => {})
        return;
      }

      this.result = 'No address, transaction or block hash/height found.';
    },
    determineNetwork: function() {
      return this.testnet ? TESTNET : MAINNET
    },
    populateAddressData: async function(addr) {
      try {
        var addrUtxoResult = await this.grpc.getAddressUtxos({address: addr, includeMempool: true});
        var addrResult = await this.grpc.getAddressTransactions({address: addr, nbFetch: 10000});
        this.address = addr;
        var total = 0;
        addrUtxoResult.getOutputsList().forEach(function (a) {
          total += a.getValue();
        });
        this.addressData['utxos'] = addrUtxoResult.getOutputsList().length;
        this.addressData['satoshis'] = total;
        this.addressData['balance'] = sb.toBitcoin(total);
        this.addressData['legacy'] = bchaddr.toLegacyAddress(addr);
        this.addressData['confirmed_transactions'] = addrResult.getConfirmedTransactionsList().length;
        this.addressData['unconfirmed_transactions'] = addrResult.getUnconfirmedTransactionsList().length;
      } catch(error) {
        this.result = "Address not found.";
      }
    },
    populateBlockData: async function(input) {
      var blockFinder = 'hash';

      if (input >= 0 && input < 10000000) {
        blockFinder = 'height';
      }

      try {
        var blockResult = "";

        if (blockFinder === 'height') {
          blockResult = await this.grpc.getBlockInfo({index: input});
        } else {
          blockResult = await this.grpc.getBlockInfo({hash: input, reversedHashOrder: true});
        }

        var blockInfo = blockResult.getInfo();

        this.block = this.convertHash(blockInfo.getHash());
        this.blockData['height'] = blockInfo.getHeight();
        this.blockData['version'] = blockInfo.getVersion();
        var previousBlock = blockInfo.getPreviousBlock();
        if (previousBlock) {
          this.blockData['previous_block'] = this.convertHash(previousBlock);
        }
        this.blockData['merkle_root'] = this.convertHash(blockInfo.getMerkleRoot());
        this.blockData['timestamp'] = blockInfo.getTimestamp();
        this.blockData['bits'] = blockInfo.getBits().toString(16);
        this.blockData['nonce'] = blockInfo.getNonce();
        this.blockData['confirmations'] = blockInfo.getConfirmations();
        this.blockData['difficulty'] = blockInfo.getDifficulty();
        var nextBlock = blockInfo.getNextBlockHash();
        if (nextBlock) {
          this.blockData['next_block_hash'] = this.convertHash(nextBlock);
        }
        this.blockData['size'] = prettyBytes(blockInfo.getSize());
        this.blockData['median_time'] = blockInfo.getMedianTime();

        return true;
      } catch(error) {
        return false;
      }
    },
    populateTransactionData: async function(input) {
      try {
        var txResult = await this.grpc.getTransaction({hash: input, reversedHashOrder: true});
        this.transaction = input;
        var tx = txResult.getTransaction();
        this.transactionData['version'] = tx.getVersion();
        this.transactionData['lock_time'] = tx.getLockTime();
        this.transactionData['size'] = prettyBytes(tx.getSize());
        this.transactionData['timestamp'] = tx.getTimestamp();
        this.transactionData['confirmations'] = tx.getConfirmations();
        this.transactionData['block_height'] = tx.getBlockHeight();
        this.transactionData['block_hash'] = this.convertHash(tx.getBlockHash());
        this.transactionData['inputs'] = tx.getInputsList();
        this.transactionData['outputs'] = tx.getOutputsList();

        return true;
      } catch(error) {
        return false;
      }
    },
    resetState: function() {
      this.result = "";
      this.address = "";
      this.addressData = this.defaultAddressData();
      this.block = "";
      this.blockData = this.defaultBlockData();
      this.transaction = "";
      this.transactionData = this.defaultTransactionData();
    },
    defaultAddressData: function() {
      return {
        balance: 0,
        satoshis: 0,
        utxos: 0,
        legacy: "",
        confirmed_transactions: 0,
        unconfirmed_transactions: 0,
      }
    },
    defaultBlockData: function() {
      return {
        height: 0,
        version: 0,
        previous_block: "",
        merkle_root: "",
        timestamp: 0,
        bits: 0,
        nonce: 0,
        confirmations: 0,
        difficulty: 0,
        next_block_hash: "",
        size: 0,
        median_time: 0,
      }
    },
    defaultTransactionData: function() {
      return {
        version: 0,
        lock_time: 0,
        size: 0,
        timestamp: 0,
        confirmations: 0,
        block_height: 0,
        block_hash: "",
        inputs: [],
        outputs: [],
      }
    },
    updateNetwork: function () {
      this.grpc = new GrpcClient({testnet: this.testnet});
      this.getInfo();
    },
    getInfo: async function () {
      try {
        var blockInfo = await this.grpc.getBlockchainInfo();
        var blockHash = this.convertHash(blockInfo.getBestBlockHash());
        var blockHeight = blockInfo.getBestHeight();
        this.infoResult = "Height: " + blockHeight +
        " Block Hash: " + blockHash;
      } catch(error) {
        // Don't update, could be transient failures.
      }
    },
    convertHash: function (bytes) {
      return Array.from(bytes, function(byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
      }).reverse().join('')
    }
  },
  created: function () {
    if (this.getInfoBar) {
      this.getInfo();
      setInterval(() => {
        this.getInfo();
      }, 5000);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
[v-cloak] {display: none}

.logo {
  margin-right: auto;
  margin-left: auto;
  display: block;
  margin-bottom: 1em;
}

.info-result {
  margin-top: 0.5em;
}

.results {
  margin-top: 2em;
}

td, th, .info-result {
  white-space: -o-pre-wrap;
  word-wrap: break-word;
  white-space: pre-wrap;
  white-space: -moz-pre-wrap;
  white-space: -pre-wrap;
}

table {
  table-layout: fixed;
  width: 100%
}

footer {
  padding: 0 1em 2em;
}

h2 {
  font-weight: bold;
  font-size: 1.2em;
  margin-bottom: .5em;
}

</style>
