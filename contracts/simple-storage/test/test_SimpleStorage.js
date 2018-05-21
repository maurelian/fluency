const HttpProvider = require('ethjs-provider-http');
const Eth = require('ethjs-query');
const EthContract = require('ethjs-contract');
const fs = require('fs');
const eth = new Eth(new HttpProvider('http://localhost:8545'));
const contract = new EthContract(eth);
const {describe, it} = require('mocha');
const assert = require('assert');

const vyperContract = JSON.parse(fs.readFileSync('contracts/simple-storage/build/simpleStorage.v.py.json'));
const solidityContract = JSON.parse(fs.readFileSync('contracts/simple-storage/build/SimpleStorage.sol.json'));

testSimpleStorage(solidityContract, 'solidity');
testSimpleStorage(vyperContract, 'vyper');

async function testSimpleStorage(contractData, lang) {

  const { bytecode } = contractData;
  const abi = JSON.parse(contractData.abi);

  const SimpleStorage = contract(abi, bytecode); // error: Error: [ethjs-contract] Contract ABI must be type Array, got type undefined

  describe(`SimpleStorage: ${lang}`, () => {

    it('Initializes with a value of zero', async () => {
      let accounts =  await eth.accounts();
      let tx = await SimpleStorage.new({from: accounts[0], gas: 2000000});
      let receipt = await eth.getTransactionReceipt(tx);
      let ss = SimpleStorage.at(receipt.contractAddress);
      let value = await ss.value();
      assert.equal(value[0].toNumber(),0);
    });

    it('calling setValue changes the value', async () => {
      let accounts =  await eth.accounts();
      let tx = await SimpleStorage.new({from: accounts[0], gas: 2000000});
      let receipt = await eth.getTransactionReceipt(tx);
      let ss = SimpleStorage.at(receipt.contractAddress);

      let value = await ss.value();
      assert.equal(value[0].toNumber(), 0);

      await ss.setValue(10, {from: accounts[0]});
      value = await ss.value();
      assert.equal(value[0].toNumber(), 10);

      await ss.setValue(457, {from: accounts[0]});
      value = await ss.value();
      assert.equal(value[0].toNumber(), 457);
    });
  });
}
