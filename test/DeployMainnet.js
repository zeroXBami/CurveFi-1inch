const path = require('path');
const fs = require('fs-extra');
const ethUtil = require('ethereumjs-util');
const RLP = require('rlp');
const BN = require('bn.js');
const artifactDir = path.resolve(__dirname, '../artifacts');
const EthereumTx = require('ethereumjs-tx').Transaction
const Web3 = require('web3');
const privateKey = Buffer.from(
  'privateK',
  'hex',
)
const owner = '0xdB92F3247a9098d017b281FEFEaAE0866755129a'
const user = '0x236EbD377A44925a3428ED2D322014E4c0DC781a'
const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/879c45c440e2498ebc8930e3bf86a82a'));

// Contract Wallet
const WalletABIPath = path.join(artifactDir, 'Wallet.abi');
const WalletRawABIData = fs.readFileSync(WalletABIPath, 'utf-8');
const WalletContractABI = JSON.parse(WalletRawABIData);
const WalletBytecodePath = path.join(artifactDir, 'Wallet.bytecode');
const WalletRontractByteCode = fs.readFileSync(WalletBytecodePath, 'utf-8');
 
// Contract Recipe
const RecipeABIPath = path.join(artifactDir, 'Recipe.abi');
const RecipeRawABIData = fs.readFileSync(RecipeABIPath, 'utf-8');
const RecipeContractABI = JSON.parse(RecipeRawABIData);
const RecipeBytecodePath = path.join(artifactDir, 'Recipe.bytecode');
const RecipeContractByteCode = fs.readFileSync(RecipeBytecodePath, 'utf-8');

// Contract Recipe
const NewRecipeABIPath = path.join(artifactDir, 'NewRecipe.abi');
const NewRecipeRawABIData = fs.readFileSync(NewRecipeABIPath, 'utf-8');
const NewRecipeContractABI = JSON.parse(NewRecipeRawABIData);
const NewRecipeBytecodePath = path.join(artifactDir, 'NewRecipe.bytecode');
const NewRecipeContractByteCode = fs.readFileSync(NewRecipeBytecodePath, 'utf-8');

// Contract Admin
const AdminABIPath = path.join(artifactDir, 'Admin.abi');
const AdminRawABIData = fs.readFileSync(AdminABIPath, 'utf-8');
const AdminContractABI = JSON.parse(AdminRawABIData);
const AdminBytecodePath = path.join(artifactDir, 'Admin.bytecode');
const AdminContractByteCode = fs.readFileSync(AdminBytecodePath, 'utf-8');


const USDC_ADDR = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const DAI_ADDR = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const cUSDC_ADDR = '0x39AA39c021dfbaE8faC545936693aC917d5E7563'
const cDAI_ADDR = '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643'
const CurvePool_ADDR = '0x3740fb63ab7a09891d7c0d4299442a551d06f5fd'
const CurveFi_ADDR = '0x2e60CF74d81ac34eB21eEff58Db4D385920ef419'
const SCW_ADDR = '0x199b0999e2ead19d0f0e9d459071351de77a210d'
const recipe_ADDR = '0x44a8db41191fe6cf938929e90271b0931035d602'
const newRecipe_ADDR = '0x5ce780da58c81a78e0e15ce441e6ee2c5bf8a5aa'
const admin_ADDR = '0x89d0772Bb5DbA0A9FEAB16A33604226a778e216a'

const deploySCWContractData = () => {
    const scwContract = new web3.eth.Contract(WalletContractABI);
    const contractData = scwContract.deploy({
        data: WalletRontractByteCode.replace(/(\r\n|\n|\r)/gm, ''),
        arguments: [
        ]
    }).encodeABI();
    return contractData
}

const deployRecipeData = () => {
    const recipeContract = new web3.eth.Contract(RecipeContractABI);
    const contractData = recipeContract.deploy({
        data: RecipeContractByteCode.replace(/(\r\n|\n|\r)/gm, ''),
        arguments: []
    }).encodeABI();
    return contractData
}

const deployNewRecipeData = () => {
    const newRecipeContract = new web3.eth.Contract(NewRecipeContractABI);
    const contractData = newRecipeContract.deploy({
        data: NewRecipeContractByteCode.replace(/(\r\n|\n|\r)/gm, ''),
        arguments: []
    }).encodeABI();
    return contractData
}

const deployAdminData = () => {
    const adminContract = new web3.eth.Contract(AdminContractABI);
    const contractData = adminContract.deploy({
        data: AdminContractByteCode.replace(/(\r\n|\n|\r)/gm, ''),
        arguments: []
    }).encodeABI();
    return contractData 
}

const estimateGas = () => {
    const scwContract = new web3.eth.Contract(WalletContractABI);
    const contractData = scwContract.deploy({
        data: WalletRontractByteCode.replace(/(\r\n|\n|\r)/gm, ''),
        arguments: [
            owner,
            [USDC_ADDR, DAI_ADDR, cUSDC_ADDR, cDAI_ADDR]
        ]
    }).estimateGas(function(err, gas){
    console.log(gas);
    });
}

const deployContract = async () => {
    const data = deployNewRecipeData();
    web3.eth.getTransactionCount(owner).then((nonce) => {
        console.log(nonce)
        const txParams = {
            nonce: nonce,
            from: owner, 
            gasPrice: web3.utils.toHex(web3.utils.toWei('4', 'gwei')),
            value: 0, 
            gasLimit: 5000000,
            data: data
        };
        const tx = new EthereumTx(txParams, { chain: 'mainnet', hardfork: 'petersburg' })
        tx.sign(privateKey)
        const serializedTx = tx.serialize()
        web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('receipt', console.log);
    });
}
const changeOwner = async () => {
    const WalletContract = new web3.eth.Contract(WalletContractABI, SCW_ADDR);
    web3.eth.getTransactionCount(owner).then((nonce) => { 
        console.log(nonce)
        const data = WalletContract.methods.changeOwner(
            user
        ).encodeABI();
        const txParams = {
            nonce: nonce,
            from: owner, 
            to: SCW_ADDR,
            gasPrice: web3.utils.toHex(web3.utils.toWei('2', 'gwei')),
            value: 0, 
            gasLimit: 5000000,
            data: data
        };
        const tx = new EthereumTx(txParams, { chain: 'mainnet', hardfork: 'petersburg' })
        tx.sign(privateKey)
        const serializedTx = tx.serialize()
        web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('receipt', console.log);
    });
}

const getOwner = async() => {
    const WalletContract = new web3.eth.Contract(WalletContractABI, SCW_ADDR);
    const ownerContract = await WalletContract.methods.owner().call({
        from: owner
    })
    console.log(ownerContract)
}
 const invest = async () => {
    const WalletContract = new web3.eth.Contract(WalletContractABI, SCW_ADDR);
    const RecipeContract = new web3.eth.Contract(RecipeContractABI, recipe_ADDR);

    const proxyDataEncoded = RecipeContract.methods.invest(
        USDC_ADDR,
        1990560,
        0,
        [1, 0, 0, 0],
        0
      ).encodeABI();

      const proxyData = Buffer.alloc(484);
      const proxyDataBuffer = Buffer.from(proxyDataEncoded.substring(2), 'hex');
      proxyDataBuffer.copy(proxyData, 0, 0, proxyDataBuffer.length );
      //token: address[4], amount: uint256[4], to: address, proxyData: bytes[484]
      const hashDataToSign = await WalletContract.methods.hashForInvestMethod(
        [DAI_ADDR, USDC_ADDR, cDAI_ADDR, cUSDC_ADDR],
        [0, 1990560, 0, 0],
        recipe_ADDR,
        proxyData
        ).call({
          from: owner
        })
        const user_privateK = ""
        const sign = await web3.eth.accounts.sign(hashDataToSign, user_privateK);        
        const signature =  Buffer.from(sign.signature.toString().substring(2), "hex");

        const data =  WalletContract.methods.invest(
            [DAI_ADDR, USDC_ADDR, cDAI_ADDR, cUSDC_ADDR],
            [0, 1990560, 0, 0],
            recipe_ADDR,
            proxyData,
            signature
        ).encodeABI();

        web3.eth.getTransactionCount(owner).then((nonce) => {
        console.log(nonce)
        const txParams = {
            nonce: nonce,
            from: owner, 
            to: SCW_ADDR,
            gasPrice: web3.utils.toHex(web3.utils.toWei('2', 'gwei')),
            value: 0, 
            gasLimit: 8000000,
            data: data
        };
        const tx = new EthereumTx(txParams, { chain: 'mainnet', hardfork: 'petersburg' })
        tx.sign(privateKey)
        const serializedTx = tx.serialize()
        web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('receipt', console.log);
    });
}
const redeem = async() => {
    const WalletContract = new web3.eth.Contract(WalletContractABI, SCW_ADDR);
    const RecipeContract = new web3.eth.Contract(RecipeContractABI, recipe_ADDR);
    //redeemAmount: uint256, recvToken: address, recvMinReturn: uint256, trade_dist: uint256[4], disableFlags: uint256
    const proxyDataEncoded = RecipeContract.methods.redeem(
        web3.utils.toWei('1.496778595564248662'.toString(), 'ether'),
        DAI_ADDR,
        0,
        [1, 0, 0, 0],
        0
    ).encodeABI();
    const proxyData = Buffer.alloc(484);
    const proxyDataBuffer = Buffer.from(proxyDataEncoded.substring(2), 'hex');
    proxyDataBuffer.copy(proxyData, 0, 0, proxyDataBuffer.length);
    //redeemToken: address, redeemAmount: uint256, recvToken: address, recvMinAmount: uint256, to: address, proxyData: bytes[484]
    const hashDataToSign = await WalletContract.methods.hashForRedeemMethod(
        CurvePool_ADDR,
        web3.utils.toWei('1.496778595564248662'.toString(), 'ether'),
        DAI_ADDR,
        0,
        recipe_ADDR,
        proxyData
    ).call({
        from: owner
    })
    const user_privateK = ""
    const sign = await web3.eth.accounts.sign(hashDataToSign, user_privateK);        
    const signature =  Buffer.from(sign.signature.toString().substring(2), "hex");
    //redeemToken: address, redemAmount: uint256, recvToken: address, recvMinAmount: uint256, to: address, proxyData: bytes[484], _sig: bytes[65]
    const data =  WalletContract.methods.redeem(
        CurvePool_ADDR,
        web3.utils.toWei('1.496778595564248662'.toString(), 'ether'),
        DAI_ADDR,
        0,
        recipe_ADDR,
        proxyData,
        signature
    ).encodeABI();
// Working here
    web3.eth.getTransactionCount(owner).then((nonce) => {
        console.log(nonce)
        const txParams = {
            nonce: nonce,
            from: owner, 
            to: SCW_ADDR,
            gasPrice: web3.utils.toHex(web3.utils.toWei('3', 'gwei')),
            value: 0, 
            gasLimit: 8000000,
            data: data
        };
        const tx = new EthereumTx(txParams, { chain: 'mainnet', hardfork: 'petersburg' })
        tx.sign(privateKey)
        const serializedTx = tx.serialize()
        web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('receipt', console.log);
    });
}

const swapToNewRecipe = async () => {
    const WalletContract = new web3.eth.Contract(WalletContractABI, SCW_ADDR);
    const RecipeContract = new web3.eth.Contract(RecipeContractABI, recipe_ADDR);
    const NewRecipeContract = new web3.eth.Contract(NewRecipeContractABI, newRecipe_ADDR);
    // Redeem from current recipe:
    const proxyRedeemDataEncoded = RecipeContract.methods.redeem(
        web3.utils.toWei('1.963320221207125973'.toString(), 'ether'),
        DAI_ADDR,
        0,
        [1, 0, 0, 0],
        0
    ).encodeABI();
    const proxyRedeemData = Buffer.alloc(484);
    const proxyRedeemDataBuffer = Buffer.from(proxyRedeemDataEncoded.substring(2), 'hex');
    proxyRedeemDataBuffer.copy(proxyRedeemData, 0, 0, proxyRedeemDataBuffer.length);
    
    const proxyInvestDataEncoded = NewRecipeContract.methods.investDAIUSDC(
        DAI_ADDR,
        web3.utils.toWei('1.5'.toString(), 'ether'),
    ).encodeABI();

    const proxyInvestData = Buffer.alloc(484);
    const proxyInvestDataBuffer = Buffer.from(proxyInvestDataEncoded.substring(2), 'hex');
    proxyInvestDataBuffer.copy(proxyInvestData, 0, 0, proxyInvestDataBuffer.length);
   
    const hashDataToSign = await WalletContract.methods.hashForSwap(
        recipe_ADDR,
        newRecipe_ADDR,
        CurvePool_ADDR,
        web3.utils.toWei('1.963320221207125973'.toString(), 'ether'),
        DAI_ADDR,
        0,
        proxyRedeemData,
        proxyInvestData
    ).call({
        from: owner
    })
    const user_privateK = ""
    const sign = await web3.eth.accounts.sign(hashDataToSign, user_privateK);        
    const signature =  Buffer.from(sign.signature.toString().substring(2), "hex");
   
    const data =  WalletContract.methods.swapRecipe(
        recipe_ADDR,
        newRecipe_ADDR,
        CurvePool_ADDR,
        web3.utils.toWei('1.963320221207125973'.toString(), 'ether'),
        DAI_ADDR,
        0,
        proxyRedeemData,
        proxyInvestData,
        signature
    ).encodeABI();

    web3.eth.getTransactionCount(owner).then((nonce) => {
        console.log(nonce)
        const txParams = {
            nonce: nonce,
            from: owner, 
            to: SCW_ADDR,
            gasPrice: web3.utils.toHex(web3.utils.toWei('', 'gwei')),
            value: 0, 
            gasLimit: 8000000,
            data: data
        };
        const tx = new EthereumTx(txParams, { chain: 'mainnet', hardfork: 'petersburg' })
        tx.sign(privateKey)
        const serializedTx = tx.serialize()
        web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('receipt', console.log);
    });
}

const withdrawal = async () => {
     const WalletContract = new web3.eth.Contract(WalletContractABI, SCW_ADDR);
     const hashDataToSign = await WalletContract.methods.hashForWithDrawal(
         DAI_ADDR,
         web3.utils.toWei('1.50947072168943333'.toString(), 'ether'),
         owner
     ).call({
        from: owner
    })
    const user_privateK = ""
    const sign = await web3.eth.accounts.sign(hashDataToSign, user_privateK);        
    const signature =  Buffer.from(sign.signature.toString().substring(2), "hex");
    //@public
                // def transferFrom(token: address, 
                //  amount: uint256, 
                //  to: address, 
                //  admin: address, 
                //  _sig: bytes[65]):

    const data = WalletContract.methods.transferFrom(
        DAI_ADDR,
        web3.utils.toWei('1.50947072168943333'.toString(), 'ether'),
        owner,
        admin_ADDR,
        signature
    ).encodeABI();
    web3.eth.getTransactionCount(owner).then((nonce) => {
        console.log(nonce)
        const txParams = {
            nonce: nonce,
            from: owner, 
            to: SCW_ADDR,
            gasPrice: web3.utils.toHex(web3.utils.toWei('6', 'gwei')),
            value: 0, 
            gasLimit: 8000000,
            data: data
        };
        const tx = new EthereumTx(txParams, { chain: 'mainnet', hardfork: 'petersburg' })
        tx.sign(privateKey)
        const serializedTx = tx.serialize()
        web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('receipt', console.log);
    });
}

// invest()
// redeem()
// swapToNewRecipe()
// deployContract()
// withdrawal()
// changeOwner()
// getOwner()
// estimateGas()
