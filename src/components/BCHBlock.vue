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
  <div id="bchablock">
    <table class="table is-bordered is-striped" align="center">
      <thead>
        <th colspan="2">{{block}}</th>
      </thead>
      <tbody>
        <tr>
          <td>Height</td><td>{{blockData['height']}}</td>
        </tr>
        <tr>
          <td>Version</td><td>{{blockData['version']}}</td>
        </tr>
        <tr>
          <td>Previous Block</td><td>{{blockData['previous_block']}}</td>
        </tr>
        <tr>
          <td>Merkle Root</td><td>{{blockData['merkle_root']}}</td>
        </tr>
        <tr>
          <td>Timestamp</td><td>{{blockData['timestamp']}}</td>
        </tr>
        <tr>
          <td>Bits</td><td>{{blockData['bits']}}</td>
        </tr>
        <tr>
          <td>Nonce</td><td>{{blockData['nonce']}}</td>
        </tr>
        <tr>
          <td>Confirmations</td><td>{{blockData['confirmations']}}</td>
        </tr>
        <tr>
          <td>Difficulty</td><td>{{blockData['difficulty']}}</td>
        </tr>
        <tr>
          <td>Next Block Hash</td><td>{{blockData['next_block_hash']}}</td>
        </tr>
        <tr>
          <td>Size</td><td>{{blockData['size']}}</td>
        </tr>
        <tr>
          <td>Median Time</td><td>{{blockData['median_time']}}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'bchblock',
  props: ['block', 'blockData'],
}
</script>
