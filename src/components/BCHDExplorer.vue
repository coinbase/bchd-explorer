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
        <select v-model="selectedNetwork" @change="updateNetwork">
          <option v-for="node in nodes" :value="node.url" :key="node.url">
            {{ node.name }} ({{ node.network }})
          </option>
        </select>
      </div>
      <br/>
      <div class="container">
        <img class="logo" src="../assets/bchd-explorer.svg" />
        <div class="field">
          <div class="control has-icons-left">
            <input
              class="input is-primary"
              type="text"
              v-model="input"
              :autofocus="'autofocus'"
              autocomplete="off"
              placeholder="Address, transaction or block hash/height"
              @keyup.enter="search"
            />
            <span class="icon is-small is-left">
              <i class="fas fa-search"></i>
            </span>
          </div>
        </div>
      </div>
      <div class="info-result container has-text-centered info-result">{{infoResult}}</div>
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
import Big from "big.js";
import { GrpcClient } from "grpc-bchrpc-web";
import bchaddr from "bchaddrjs-slp";
import BCHAddress from "./BCHAddress.vue";
import BCHBlock from "./BCHBlock.vue";
import BCHTransaction from "./BCHTransaction.vue";
import sb from "satoshi-bitcoin";
import prettyBytes from "pretty-bytes";

const TESTNET3 = "testnet3";
const MAINNET = "mainnet";

export default {
  name: "explorer",
  components: {
    BCHAddress,
    BCHBlock,
    BCHTransaction
  },
  data: function() {
    return {
      result: "",
      infoResult: " ",
      input: "",
      grpc: this.newGrpcClient(),
      testnet: false,
      address: "",
      addressData: this.defaultAddressData(),
      transaction: "",
      transactionData: this.defaultTransactionData(),
      block: "",
      blockData: this.defaultBlockData(),
      getInfoBar: true,
      nodes: [
        { url: "https://bchd.greyh.at:8335", name: "bchd.greyh.at", network: MAINNET },
        { url: "https://bchd-testnet.greyh.at:18335", name: "bchd-testnet.greyh.at", network: TESTNET3 },
        { url: "https://bchd.ny1.simpleledger.io", name: "bchd.ny1.simpleledger.io", network: MAINNET },
        { url: "https://bchd.nl1.simpleledger.io", name: "bchd.nl1.simpleledger.io", network: MAINNET },
        { url: "https://bchd.fountainhead.cash", name: "bchd.fountainhead.cash", network: MAINNET },
        { url: "https://localhost:8335", name: "localhost:8335", network: MAINNET },
        { url: "https://localhost:18335", name: "localhost:18335", network: TESTNET3 }
      ],
      selectedNetwork: "https://bchd.greyh.at:8335"
    };
  },
  mounted() {
    this.testnet = this.$route.params.network === TESTNET3;
    this.updateNetwork();
    const params = this.$route.params;
    const input = params.address || params.blockHash || params.txId;
    if (input != undefined) {
      this.searchBCHD(input);
    }
  },
  watch: {
    $route(to) {
      this.testnet = to.params.network === TESTNET3;
      this.updateNetwork();
      this.input = "";
      const input = to.params.address || to.params.blockHash || to.params.txId;
      if (input != undefined) {
        this.searchBCHD(input);
      }
    }
  },
  methods: {
    search: async function() {
      this.searchBCHD(this.input);
    },
    searchBCHD: async function(input) {
      this.resetState();
      if (input == "") {
        this.$router.push({ name: "home" }).catch(() => {});
        return;
      }
      if (bchaddr.isValidAddress(input)) {
        var addr = bchaddr.toCashAddress(input);
        await this.populateAddressData(addr);
        this.$router
          .push({
            name: "address",
            params: {
              network: this.determineNetwork(),
              address: input
            }
          })
          .catch(() => {});
        return;
      }
      var blockData = await this.populateBlockData(input);
      if (blockData === true) {
        this.$router
          .push({
            name: "block",
            params: {
              network: this.determineNetwork(),
              blockHash: input
            }
          })
          .catch(() => {});
        return;
      }
      var transactionData = await this.populateTransactionData(input);
      if (transactionData === true) {
        this.$router
          .push({
            name: "tx",
            params: {
              network: this.determineNetwork(),
              txId: input
            }
          })
          .catch(() => {});
        return;
      }
      this.result = "No address, transaction or block hash/height found.";
    },
    determineNetwork: function() {
      return this.testnet ? TESTNET3 : MAINNET;
    },
    populateAddressData: async function(addr) {
      try {
        var addrUtxoResult = await this.grpc.getAddressUtxos({
          address: addr,
          includeMempool: true,
          includeTokenMetadata: true
        });
        var addrResult = await this.grpc.getAddressTransactions({
          address: addr,
          nbFetch: 10000
        });
        this.address = addr;
        var total = 0;
        addrUtxoResult.getOutputsList().forEach(function(a) {
          total += a.getValue();
        });
        this.addressData["utxos"] = addrUtxoResult.getOutputsList().length;
        this.addressData["satoshis"] = total;
        this.addressData["balance"] = sb.toBitcoin(total);
        this.addressData["legacy"] = bchaddr.toLegacyAddress(addr);
        this.addressData["cash"] = bchaddr.toCashAddress(addr);
        this.addressData["slp"] = bchaddr.toSlpAddress(addr);
        this.addressData[
          "confirmed_transactions"
        ] = addrResult.getConfirmedTransactionsList().length;
        this.addressData[
          "unconfirmed_transactions"
        ] = addrResult.getUnconfirmedTransactionsList().length;
        const _tokens = new Map();
        const tokenMetadata = new Map();
        addrUtxoResult.getTokenMetadataList().forEach(tm => {
          const _id = Buffer.from(tm.getTokenId_asU8()).toString("hex");
          const _tmObj = { token_id: _id, name: "", ticker: "" };
          tokenMetadata.set(_id, _tmObj);
          if (tm.hasV1Fungible()) {
            _tmObj.name = tm.getV1Fungible().getTokenName();
            _tmObj.ticker = Buffer.from(tm.getV1Fungible().getTokenTicker()).toString("utf8");
            _tmObj.document_url = tm.getV1Fungible().getTokenDocumentUrl() !== "" ? tm.getV1Fungible().getTokenDocumentUrl() : "NA";
            _tmObj.document_hash = tm.getV1Fungible().getTokenDocumentHash() !== "" ? tm.getV1Fungible().getTokenDocumentHash() : "NA";
            _tmObj.mint_baton_txid = Buffer.from(tm.getV1Fungible().getMintBatonHash_asU8().slice().reverse()).toString("hex");
            _tmObj.mint_baton_vout = tm.getV1Fungible().getMintBatonVout();
          } else if (tm.hasV1Nft1Group()) {
            _tmObj.name = tm.getV1Nft1Group().getTokenName();
            _tmObj.ticker = tm.getV1Nft1Group().getTokenTicker();
            _tmObj.document_url = tm.getV1Nft1Group().getTokenDocumentUrl() !== "" ? tm.getV1Nft1Group().getTokenDocumentUrl() : "NA";
            _tmObj.document_hash = tm.getV1Nft1Group().getTokenDocumentHash_asB64() ? tm.getV1Nft1Group().getTokenDocumentHash() : "NA";
            _tmObj.mint_baton_txid = Buffer.from(tm.getV1Nft1Group().getMintBatonHash_asU8().slice().reverse()).toString("hex");
            _tmObj.mint_baton_vout = tm.getV1Nft1Group().getMintBatonVout();
          } else if (tm.hasV1Nft1Child()) {
            _tmObj.name = tm.getV1Nft1Child().getTokenName();
            _tmObj.ticker = tm.getV1Nft1Child().getTokenTicker();
            _tmObj.document_url = tm.getV1Nft1Child().getTokenDocumentUrl() !== "" ? tm.getV1Nft1Child().getTokenDocumentUrl() : "NA";
            _tmObj.document_hash = tm.getV1Nft1Child().getTokenDocumentHash_asB64() ? Buffer.from(tm.getV1Nft1Child().getTokenDocumentHash_asU8()).toString("utf8") : "NA";
            _tmObj.nft_group_id = Buffer.from(tm.getV1Nft1Child().getGroupId_asU8()).toString("hex");
          }
        });
        addrUtxoResult.getOutputsList().forEach(function(a) {
          if (a.getSlpToken()) {
            const tok = a.getSlpToken();
            const tokenID = Buffer.from(tok.getTokenId_asU8()).toString("hex");
            if (_tokens.has(tokenID)) {
              const _tok = _tokens.get(tokenID);
              _tok.balance = _tok.balance.add(tok.getAmount());
            } else {
              _tokens.set(tokenID, {
                token_id: tokenID,
                token_metadata: tokenMetadata.get(tokenID),
                decimals: tok.getDecimals(),
                balance: Big(tok.getAmount())
              });
            }
          }
        });
        this.addressData["tokens"] = Array.from(_tokens).map(v => v[1]);
      } catch (error) {
        this.result = "Address not found.";
      }
    },
    populateBlockData: async function(input) {
      var blockFinder = "hash";
      if (input >= 0 && input < 10000000) {
        blockFinder = "height";
      }
      try {
        var blockResult = "";
        if (blockFinder === "height") {
          blockResult = await this.grpc.getBlockInfo({ index: input });
        } else {
          blockResult = await this.grpc.getBlockInfo({
            hash: input,
            reversedHashOrder: true
          });
        }
        var blockInfo = blockResult.getInfo();
        this.block = this.convertHash(blockInfo.getHash());
        this.blockData["height"] = blockInfo.getHeight();
        this.blockData["version"] = blockInfo.getVersion();
        var previousBlock = blockInfo.getPreviousBlock();
        if (previousBlock) {
          this.blockData["previous_block"] = this.convertHash(previousBlock);
        }
        this.blockData["merkle_root"] = this.convertHash(
          blockInfo.getMerkleRoot()
        );
        this.blockData["timestamp"] = blockInfo.getTimestamp();
        this.blockData["bits"] = blockInfo.getBits().toString(16);
        this.blockData["nonce"] = blockInfo.getNonce();
        this.blockData["confirmations"] = blockInfo.getConfirmations();
        this.blockData["difficulty"] = blockInfo.getDifficulty();
        var nextBlock = blockInfo.getNextBlockHash();
        if (nextBlock) {
          this.blockData["next_block_hash"] = this.convertHash(nextBlock);
        }
        this.blockData["size"] = prettyBytes(blockInfo.getSize());
        this.blockData["median_time"] = blockInfo.getMedianTime();
        return true;
      } catch (error) {
        return false;
      }
    },
    populateTransactionData: async function(input) {
      try {
        var txResult = await this.grpc.getTransaction({
          hash: input,
          reversedHashOrder: true,
          includeTokenMetadata: true
        });
        this.transaction = input;
        var tx = txResult.getTransaction();
        this.transactionData["version"] = tx.getVersion();
        this.transactionData["lock_time"] = tx.getLockTime();
        this.transactionData["size"] = prettyBytes(tx.getSize());
        this.transactionData["timestamp"] = tx.getTimestamp();
        this.transactionData["confirmations"] = tx.getConfirmations();
        this.transactionData["block_height"] = tx.getBlockHeight();
        this.transactionData["block_hash"] = this.convertHash(
          tx.getBlockHash()
        );
        this.transactionData["inputs"] = tx.getInputsList();
        this.transactionData["outputs"] = tx.getOutputsList();
        // set some slp properties
        this.transactionData["slp_action"] = tx.getSlpTransactionInfo().getSlpAction();
        this.transactionData["slp_action_str"] = this.mapSlpTransactionTypeString(this.transactionData["slp_action"]);
        this.transactionData["slp_valid"] = tx.getSlpTransactionInfo().getValidityJudgement();
        this.transactionData["slp_parse_error"] = tx.getSlpTransactionInfo().getParseError();
        this.transactionData["burn_flags"] = this.mapBurnFlagToString(tx.getSlpTransactionInfo().getBurnFlagsList());
        
        const inputAmtMap = new Map();
        let outputAmt = Big(0);
        // loop through txn outputs set view data for slp tokens
        this.transactionData["outputs"].forEach((o) => {
          o.token = undefined;
          if (o.getSlpToken()) {
            let tok = o.getSlpToken();
            if (tok) {
              o.token = {};
              o.token.amount = Big(tok.getAmount()).div(10**tok.getDecimals());
              outputAmt = outputAmt.add(o.token.amount);
              o.token.isMintBaton = tok.getIsMintBaton();
              o.token.decimals = tok.getDecimals();
              o.token.address = tok.getAddress();
            }
          }
        });
        // set token metadata for valid slp transaction
        if (this.transactionData["slp_valid"]) {
          const tm = txResult.getTokenMetadata();
          const _id = Buffer.from(tm.getTokenId_asU8()).toString("hex");
          const _tmObj = { token_id: _id, name: "", ticker: ""};
          _tmObj.token_type = tm.getTokenType();
          if (tm.hasV1Fungible()) {
            _tmObj.name = tm.getV1Fungible().getTokenName();
            _tmObj.ticker = tm.getV1Fungible().getTokenTicker();
          } else if (tm.hasV1Nft1Group()) {
            _tmObj.name = tm.getV1Nft1Group().getTokenName();
            _tmObj.ticker = tm.getV1Nft1Group().getTokenTicker();
          } else if (tm.hasV1Nft1Child()) {
            _tmObj.name = tm.getV1Nft1Child().getTokenName();
            _tmObj.ticker = tm.getV1Nft1Child().getTokenTicker();
            _tmObj.nft_group_id = Buffer.from(tm.getV1Nft1Child().getGroupId()).toString("hex");
          }
          if (_tmObj.name === "") {
            _tmObj.name = "NA";
          }
          if (_tmObj.ticker === "") {
            _tmObj.ticker = "tokens";
          }
          this.transactionData["token_metadata"] = _tmObj;
        }
        // loop through txn inputs to populate slp token view data
        const dat = this.transactionData;
        this.transactionData["inputs"].forEach((i) => {
          i.token = undefined;
          if (i.getSlpToken()) {
            let tok = i.getSlpToken();
            if (tok) {
              i.token = {};
              i.token.amount = Big(tok.getAmount()).div(10**tok.getDecimals());
              i.token.isMintBaton = tok.getIsMintBaton();
              i.token.decimals = tok.getDecimals();
              i.token.token_id = Buffer.from(tok.getTokenId_asU8()).toString("hex");
              i.token.slp_action = tok.getSlpAction();
              i.token.token_type = tok.getTokenType();
              if (dat.token_metadata) {
                if (i.token.token_id !== dat.token_metadata.token_id || i.token.token_type !== dat.token_metadata.token_type) {
                  i.token.isBurned = true;
                  i.token.ticker = "";
                } else {
                  i.token.ticker = dat["token_metadata"].ticker;
                }
              }
              // enumerate inputs for displaying burn quantity
              if (! inputAmtMap.has(i.token.token_id + i.token.token_type)) {
                inputAmtMap.set(i.token.token_id + i.token.token_type, i.token.amount);
              } else {
                let totalAmt = inputAmtMap.get(i.token.token_id + i.token.token_type);
                totalAmt = totalAmt.add(i.token.amount);
                inputAmtMap.set(i.token.token_id + i.token.token_type, totalAmt);
              }
              if (dat.burn_flags.includes("BURNED_INPUTS_OUTPUTS_TOO_HIGH") || dat.burn_flags.includes("BURNED_INPUTS_BAD_OPRETURN")) {
                i.token.isBurned = true;
                i.token.ticker = "";
              }
            }
          }
        });
        // set burned amount to display
        if (dat.token_metadata) {
          for (const amt of inputAmtMap) {
            if (amt[0] === dat.token_metadata.token_id + dat.token_metadata.token_type) {
              amt[1] = amt[1].sub(outputAmt);
              if (amt[1].gt(0)) {
                dat.burn_amt_this_token = amt[1].toFixed();
              }
            } else {
              dat.burns_from_other_tokens = true;
            }
          }
        } else if (inputAmtMap.size > 0) {
          dat.burns_from_other_tokens = true;
        }
        return true;
      } catch (error) {
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
        slp: "",
        confirmed_transactions: 0,
        unconfirmed_transactions: 0,
        tokens: [],
      };
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
        median_time: 0
      };
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
        token_metadata: undefined,
        slp_action: 0,
        slp_action_str: "",
        slp_valid: false,
        slp_parse_error: ""
      };
    },
    updateNetwork: function() {
      this.resetState();
      this.infoResult = "Not connected (select another server)";
      this.grpc = null;
      this.grpc = this.newGrpcClient();
      this.getInfo();
    },
    newGrpcClient: function() {
      return new GrpcClient({
        url: this.selectedNetwork,
        testnet: false
      });
    },
    getInfo: async function() {
      try {
        var blockInfo = await this.grpc.getBlockchainInfo();
        var blockHash = this.convertHash(blockInfo.getBestBlockHash());
        var blockHeight = blockInfo.getBestHeight();
        this.infoResult =
          "Height: " + blockHeight + " Block Hash: " + blockHash;
      } catch (error) {
        // Don't update, could be transient failures.
      }
    },
    convertHash: function(bytes) {
      return Array.from(bytes, function(byte) {
        return ("0" + (byte & 0xff).toString(16)).slice(-2);
      })
        .reverse()
        .join("");
    },
    mapSlpTransactionTypeString: function(type) {
      switch (type) {
        case 0:
          return "NON_SLP";
        case 1:
          return "NON_SLP_BURN";
        case 2:
          return "SLP_PARSE_ERROR";
        case 3:
          return "SLP_UNSUPPORTED_VERSION";
        case 4:
          return "SLP_V1_GENESIS";
        case 5:
          return "SLP_V1_MINT";
        case 6:
          return "SLP_V1_SEND";
        case 7:
          return "SLP_V1_NFT1_GROUP_GENESIS";
        case 8:
          return "SLP_V1_NFT1_GROUP_MINT";
        case 9:
          return "SLP_V1_NFT1_GROUP_SEND";
        case 10:
          return "SLP_V1_NFT1_UNIQUE_CHILD_GENESIS";
        case 11:
          return "SLP_V1_NFT1_UNIQUE_CHILD_SEND";
        default:
          return "unknown type";
      }
    },
    mapBurnFlagToString: function(flags) {
      let flagStr = "";
      flags.forEach((f) => {
        switch(f) {
          case 0:
            flagStr = flagStr + "BURNED_INPUTS_OUTPUTS_TOO_HIGH\n";
            break;
          case 1:
            flagStr = flagStr + "BURNED_INPUTS_BAD_OPRETURN\n";
            break;
          case 2:
            flagStr = flagStr + "BURNED_INPUTS_OTHER_TOKEN\n";
            break;
          case 3:
            flagStr = flagStr + "BURNED_OUTPUTS_MISSING_BCH_VOUT\n";
            break;
          case 4:
            flagStr = flagStr + "BURNED_INPUTS_GREATER_THAN_OUTPUTS\n";
            break;
          default:
            flagStr = flagStr + "unknown burn type\n"
        }
      });
      return flagStr;
    },
  },
  created: function() {
    if (this.getInfoBar) {
      this.getInfo();
      setInterval(() => {
        this.getInfo();
      }, 5000);
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
[v-cloak] {
  display: none;
}

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

td,
th,
.info-result {
  white-space: -o-pre-wrap;
  word-wrap: break-word;
  white-space: pre-wrap;
  white-space: -moz-pre-wrap;
  white-space: -pre-wrap;
}

table {
  table-layout: fixed;
  width: 100%;
}

footer {
  padding: 0 1em 2em;
}

h2 {
  font-weight: bold;
  font-size: 1.2em;
  margin-bottom: 0.5em;
}
</style>
