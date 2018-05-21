const fs = require('fs');
const shell = require('shelljs');
const colors = require('colors');
const solc = require('solc');

const argv        = require('yargs').argv;

// build with solc, then build with vyper
const contractsPath = './contracts/simple-storage';
const solFileName = 'SimpleStorage.sol';
const vyFileName = 'simpleStorage.v.py';
const buildDirPath = `${contractsPath}/build`;

build('./contracts/simple-storage/simpleStorage.v.py', './contracts/simple-storage/build')
build('./contracts/simple-storage/SimpleStorage.sol', './contracts/simple-storage/build')

function build(source, buildPath){
    if (!shell.test('-d', buildDirPath)) {
         fs.mkdir(buildDirPath);
    }
    let sourceTypingArray = source.split('.').reverse();

    if (sourceTypingArray[0] == 'sol') {
        buildWithSolidity(source, buildPath);
    } else if(sourceTypingArray[0] == 'py' && sourceTypingArray[1] == 'v' ){
        buildWithVyper(source, buildPath);
    }
};

function buildWithSolidity(source, buildPath){
    console.log(`Compiling solidity from source code: \n ${source}`.yellow);
    const input = fs.readFileSync(source).toString();
    const output = solc.compile(input.toString(), 1)

    for (const contractName in output.contracts) {
        let {interface, bytecode, runtimeBytecode} = output.contracts[contractName];
        // extract the contract name
        let fileName = contractName.replace(':','');
        fs.writeFileSync(`${buildPath}/${fileName}.sol.json`, 
          JSON.stringify({abi: interface, bytecode, runtimeBytecode})
        );

        console.log(`Writing solidity output to: \n ${buildPath}/${fileName}.sol.json`.green);
    }
};

function buildWithVyper(source, buildPath){
    console.log(`Compiling vyper from source code: ${source}`.yellow);
    const input = fs.readFileSync(source).toString();    

    let abi = shell.exec(`vyper -f json ${source}`, {silent: true}).stdout.replace('\n','');
    let bytecode = shell.exec(`vyper -f bytecode ${source}`, {silent: true}).stdout.replace('\n','');
    let runtimeBytecode = shell.exec(`vyper -f bytecode_runtime ${source}`, {silent: true}).stdout.replace('\n','');
    let fileName = source.split('/').pop();

    fs.writeFileSync(`${buildPath}/${fileName}.json`, 
      JSON.stringify({abi, bytecode, runtimeBytecode})
    );
    console.log(`Writing output to: ${buildPath}/${fileName}.json`.green);
}

