const path = require('path');
const fs = require('fs-extra');
const ethUtil = require('ethereumjs-util');
const RLP = require('rlp');
const BN = require('bn.js');
const artifactDir = path.resolve(__dirname, '../artifacts');

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

// Contract ERC20
const TokenABIPath = path.join(artifactDir, 'ERC20.abi');
const TokenRawABIData = fs.readFileSync(TokenABIPath, 'utf-8');
const TokenContractABI = JSON.parse(TokenRawABIData);
const TokenBytecodePath = path.join(artifactDir, 'ERC20.bytecode');
const TokenContractByteCode = fs.readFileSync(TokenBytecodePath, 'utf-8');

// Contract Curve
const CurveABIPath = path.join(artifactDir, 'CurveFi.abi');
const CurveRawABIData = fs.readFileSync(CurveABIPath, 'utf-8');
const CurveContractABI = JSON.parse(CurveRawABIData);
const CurveBytecodePath = path.join(artifactDir, 'CurveFi.bytecode');
const CurveContractByteCode = fs.readFileSync(CurveBytecodePath, 'utf-8');

// Contract Admin
const AdminABIPath = path.join(artifactDir, 'Admin.abi');
const AdminRawABIData = fs.readFileSync(AdminABIPath, 'utf-8');
const AdminContractABI = JSON.parse(AdminRawABIData);
const AdminBytecodePath = path.join(artifactDir, 'Admin.bytecode');
const AdminContractByteCode = fs.readFileSync(AdminBytecodePath, 'utf-8');

// Contract 1split
const OneSplit = artifacts.require('../contracts/oneSplit.sol');

const AdminContract = async (web3) => {

    const deploy = async ({
        from: account,
    }) => {

        const adminContract = new web3.eth.Contract(AdminContractABI, {
            from: account,
        });
        const contractDeployer = adminContract.deploy({
            data: AdminContractByteCode.replace(/(\r\n|\n|\r)/gm, ''),
            arguments: [],
        });

        const deployedContract = await contractDeployer.send({
            from: account,
            gas: 7000000,
            gasPrice: '100',
        });
        return deployedContract;
    };
    return {
        deploy,
    };
};

const CurveContract = async (web3) => {

    const deploy = async ({
        from: account,
        swapToken: swapAddress,
        coins: [cDAI, cUSDC],
    }) => {

        const curveContract = new web3.eth.Contract(CurveContractABI, {
            from: account,
        });
        const contractDeployer = curveContract.deploy({
            data: CurveContractByteCode.replace(/(\r\n|\n|\r)/gm, ''),
            arguments: [
                swapAddress,
                [cDAI, cUSDC]
            ],
        });

        const deployedContract = await contractDeployer.send({
            from: account,
            gas: 7000000,
            gasPrice: '100',
        });
        return deployedContract;
    };
    return {
        deploy,
    };
};

const TokenContract = async (web3) => {

    const deploy = async ({
        from: account,
        name: tokenName,
        decimal: tokenDecimal,
    }) => {

        const tokenContract = new web3.eth.Contract(TokenContractABI, {
            from: account,
        });
        const contractDeployer = tokenContract.deploy({
            data: TokenContractByteCode.replace(/(\r\n|\n|\r)/gm, ''),
            arguments: [
                tokenName,
                "TTK",
                tokenDecimal,
                1000000
            ],
        });

        const deployedContract = await contractDeployer.send({
            from: account,
            gas: 7000000,
            gasPrice: '100',
        });
        return deployedContract;
    };
    return {
        deploy,
    };
};


const WalletContract = async (web3) => {

    const deploy = async ({
        from: account,
        token: [DAI, USDC, cDAI, cUSDC]
    }) => {

        const walletContract = new web3.eth.Contract(WalletContractABI, {
            from: account,
        });
        const contractDeployer = walletContract.deploy({
            data: WalletRontractByteCode.replace(/(\r\n|\n|\r)/gm, ''),
            arguments: [
               
            ],
        });

        const deployedContract = await contractDeployer.send({
            from: account,
            gas: 7000000,
            gasPrice: '100',
        });
        return deployedContract;
    };
    return {
        deploy,
    };
};

const RecipeContract = async (web3) => {

    const deploy = async ({
        from: account,
        token: [DAI, USDC, cDAI, cUSDC, swap],
        curve: CurveAddr,
        oneSplit: oneSplitAddr
    }) => {

        const recipeContract = new web3.eth.Contract(RecipeContractABI, {
            from: account,
        });
        const contractDeployer = recipeContract.deploy({
            data: RecipeContractByteCode.replace(/(\r\n|\n|\r)/gm, ''),
            arguments: [
                [DAI, USDC, cDAI, cUSDC, swap],
                CurveAddr,
                oneSplitAddr
            ],
        });

        const deployedContract = await contractDeployer.send({
            from: account,
            gas: 7000000,
            gasPrice: '100',
        });
        return deployedContract;
    };
    return {
        deploy,
    };
};

contract('UnagiiContract', function(accounts) {
    // ETH1 accounts
    let zeroAddress = "0x0000000000000000000000000000000000000000"
    let owner = accounts[0]
    let owner2 = accounts[3];
    let user1_EOA = accounts[1];
    let user2_EOA = accounts[2];

    let Token = {}
    let Wallet = {};
    let Recipe = {}
    let Curve = {}
    let Admin = {}

    let walletInstance;
    let recipeInstance;
    let curveInstance;
    let oneSplitInstance;
    let adminInstance;

    let tokenInstanceDAI;
    let tokenInstanceUSDC;
    let tokenInstanceCDAI;
    let tokenInstanceCUSDC;
    let tokenInstanceSwap;

    before(async () => {
        Token = await TokenContract(web3);
        Wallet = await WalletContract(web3);
        Recipe = await RecipeContract(web3);
        Curve = await CurveContract(web3);
        Admin = await AdminContract(web3);
    });

    before(async () => {
        tokenInstanceDAI = await Token.deploy({
            from: owner,
            name: "DAI",
            decimal: 18
        })

        tokenInstanceUSDC = await Token.deploy({
            from: owner,
            name: "USDC",
            decimal: 18
        })

        tokenInstanceCDAI = await Token.deploy({
            from: owner,
            name: "cDAI",
            decimal: 18
        })

        tokenInstanceCUSDC = await Token.deploy({
            from: owner,
            name: "cUSDC",
            decimal: 18
        })

        tokenInstanceSwap = await Token.deploy({
            from: owner,
            name: "cDAIcUSDC",
            decimal: 18
        })

        oneSplitInstance = await OneSplit.new({
            from: owner
        })

        curveInstance = await Curve.deploy({
            from: owner,
            swapToken: tokenInstanceSwap._address,
            coins: [tokenInstanceCDAI._address,
                tokenInstanceCUSDC._address
            ],
        })

        adminInstance = await Admin.deploy({
            from: owner
        })

        recipeInstance = await Recipe.deploy({
            from: owner,
            token: [tokenInstanceDAI._address,
                tokenInstanceUSDC._address,
                tokenInstanceCDAI._address,
                tokenInstanceCUSDC._address,
                tokenInstanceSwap._address
            ],
            curve: curveInstance._address,
            oneSplit: oneSplitInstance.address,
        })

        walletInstance = await Wallet.deploy({
            from: owner,
            token: [tokenInstanceDAI._address, tokenInstanceUSDC._address, tokenInstanceCDAI._address, tokenInstanceCUSDC._address]
        });
    })

    describe("Invest method", function() {

        it("Wallet Contract owner is deployer", async function() {
            const walletOwner = await walletInstance.methods.owner().call({
                from: owner
            });
            assert.equal(walletOwner, owner)
        });

        it("Contract owner trasnfer ownership to user", async function() {
            await walletInstance.methods.changeOwner(user1_EOA).send({
                from: owner
            });
            const walletOwner = await walletInstance.methods.owner().call({
                from: owner
            });
            assert.equal(walletOwner, user1_EOA)
        });

        it("Recipe contract owner is deployer", async function() {
            const recipeOwner = await recipeInstance.methods.owner().call({
                from: owner
            });
            assert.equal(recipeOwner, owner)
        });

        it("Owner mint 3000 DAI, 2000 USDC, 1000 cDAI, 5000 cUSDC Token to user1", async function() {
            await tokenInstanceDAI.methods.mint(user1_EOA, web3.utils.toWei('3000'.toString(), 'ether')).send({
                from: owner,
                gas: 7000000
            })

            await tokenInstanceUSDC.methods.mint(user1_EOA, web3.utils.toWei('2000'.toString(), 'ether')).send({
                from: owner
            })

            await tokenInstanceCDAI.methods.mint(user1_EOA, web3.utils.toWei('1000'.toString(), 'ether')).send({
                from: owner
            })

            await tokenInstanceCUSDC.methods.mint(user1_EOA, web3.utils.toWei('5000'.toString(), 'ether')).send({
                from: owner
            })

            const balanceDAI = await tokenInstanceDAI.methods.balanceOf(user1_EOA).call({
                from: owner
            })
            const balanceUSDC = await tokenInstanceUSDC.methods.balanceOf(user1_EOA).call({
                from: owner
            })

            const balanceCDAI = await tokenInstanceCDAI.methods.balanceOf(user1_EOA).call({
                from: owner
            })

            const balanceCUSDC = await tokenInstanceCUSDC.methods.balanceOf(user1_EOA).call({
                from: owner
            })

            assert.equal(balanceUSDC, web3.utils.toWei('2000'.toString(), 'ether'))
            assert.equal(balanceDAI, web3.utils.toWei('3000'.toString(), 'ether'))
            assert.equal(balanceCDAI, web3.utils.toWei('1000'.toString(), 'ether'))
            assert.equal(balanceCUSDC, web3.utils.toWei('5000'.toString(), 'ether'))
        });

        it("Owner mint 10000 tokens to oneSplit ", async function() {
            await tokenInstanceDAI.methods.mint(oneSplitInstance.address, web3.utils.toWei('100000'.toString(), 'ether')).send({
                from: owner,
                gas: 7000000
            })

            await tokenInstanceUSDC.methods.mint(oneSplitInstance.address, web3.utils.toWei('100000'.toString(), 'ether')).send({
                from: owner
            })

            await tokenInstanceCDAI.methods.mint(oneSplitInstance.address, web3.utils.toWei('100000'.toString(), 'ether')).send({
                from: owner
            })

            await tokenInstanceCUSDC.methods.mint(oneSplitInstance.address, web3.utils.toWei('100000'.toString(), 'ether')).send({
                from: owner
            })

            const balanceDAI = await tokenInstanceDAI.methods.balanceOf(oneSplitInstance.address).call({
                from: owner
            })
            const balanceUSDC = await tokenInstanceUSDC.methods.balanceOf(oneSplitInstance.address).call({
                from: owner
            })

            const balanceCDAI = await tokenInstanceCDAI.methods.balanceOf(oneSplitInstance.address).call({
                from: owner
            })

            const balanceCUSDC = await tokenInstanceCUSDC.methods.balanceOf(oneSplitInstance.address).call({
                from: owner
            })

            assert.equal(balanceUSDC, web3.utils.toWei('100000'.toString(), 'ether'))
            assert.equal(balanceDAI, web3.utils.toWei('100000'.toString(), 'ether'))
            assert.equal(balanceCDAI, web3.utils.toWei('100000'.toString(), 'ether'))
            assert.equal(balanceCUSDC, web3.utils.toWei('100000'.toString(), 'ether'))
        });

        it("Set rates on OneSplitETH", async function() {
            // 1 DAI = 2 USDC, 3 cDAI, 4 cUSDC
            await oneSplitInstance.setTokenRates(tokenInstanceDAI._address, tokenInstanceUSDC._address, 2, {
                from: owner
            });

            await oneSplitInstance.setTokenRates(tokenInstanceDAI._address, tokenInstanceCUSDC._address, 4, {
                from: owner
            });

            await oneSplitInstance.setTokenRates(tokenInstanceDAI._address, tokenInstanceCDAI._address, 3, {
                from: owner
            });

            await oneSplitInstance.setTokenRates(tokenInstanceCDAI._address, tokenInstanceCUSDC._address, 2, {
                from: owner
            });
        });

        it("Owner mint 10000 swap token to Curve ", async function() {
            await tokenInstanceSwap.methods.mint(curveInstance._address, web3.utils.toWei('100000'.toString(), 'ether')).send({
                from: owner,
                gas: 7000000
            })

            const balanceSWAP = await tokenInstanceSwap.methods.balanceOf(curveInstance._address).call({
                from: owner
            })

            assert.equal(balanceSWAP, web3.utils.toWei('100000'.toString(), 'ether'))
        });

        it("User transfer [500 DAI, 1000 USDC, 400 cDAI, 2000 cUSDC] Token to user SCW", async function() {
            await tokenInstanceDAI.methods.transfer(walletInstance._address, web3.utils.toWei('500'.toString(), 'ether')).send({
                from: user1_EOA
            })

            await tokenInstanceUSDC.methods.transfer(walletInstance._address, web3.utils.toWei('1000'.toString(), 'ether')).send({
                from: user1_EOA
            })

            await tokenInstanceCDAI.methods.transfer(walletInstance._address, web3.utils.toWei('400'.toString(), 'ether')).send({
                from: user1_EOA
            })

            await tokenInstanceCUSDC.methods.transfer(walletInstance._address, web3.utils.toWei('2000'.toString(), 'ether')).send({
                from: user1_EOA
            })


            const scwBalanceDAI = await tokenInstanceDAI.methods.balanceOf(walletInstance._address).call({
                from: owner
            })

            const scwBalanceUSDC = await tokenInstanceUSDC.methods.balanceOf(walletInstance._address).call({
                from: owner
            })

            const scwBalanceCDAI = await tokenInstanceCDAI.methods.balanceOf(walletInstance._address).call({
                from: owner
            })

            const scwBalanceCUSDC = await tokenInstanceCUSDC.methods.balanceOf(walletInstance._address).call({
                from: owner
            })
            assert.equal(scwBalanceDAI, web3.utils.toWei('500'.toString(), 'ether'))
            assert.equal(scwBalanceUSDC, web3.utils.toWei('1000'.toString(), 'ether'))
            assert.equal(scwBalanceCDAI, web3.utils.toWei('400'.toString(), 'ether'))
            assert.equal(scwBalanceCUSDC, web3.utils.toWei('2000'.toString(), 'ether'))
        });

        it("Invest via meta tx", async function() {
            //_token: address[4], _amounts: uint256[4], minReturn: uint256, distribution: uint256[4], parts: uint256, disableFlags: uint256
            const proxyDataEncoded = recipeInstance.methods.invest(
                tokenInstanceDAI._address,
                web3.utils.toWei('100'.toString(), 'ether'),
                100,
                [1, 2, 4, 3],
                0
            ).encodeABI();
            const proxyData = Buffer.alloc(484);
            const proxyDataBuffer = Buffer.from(proxyDataEncoded.substring(2), 'hex');
            proxyDataBuffer.copy(proxyData, 0, 0, proxyDataBuffer.length);
            const hashDataToSign = await walletInstance.methods.hashForInvestMethod(
                [tokenInstanceDAI._address,
                    tokenInstanceUSDC._address,
                    tokenInstanceCDAI._address,
                    tokenInstanceCUSDC._address
                ],
                [web3.utils.toWei('100'.toString(), 'ether'), 0, 0, 0],
                recipeInstance._address,
                proxyData
            ).call({
                from: owner
            })
            const user1_privateK = "0x6c1b9d39801bb82b0f1f06657d193cf1cd736c210efe0a441b99acccfd822f50"
            const sign = await web3.eth.accounts.sign(hashDataToSign, user1_privateK);
            const signature = Buffer.from(sign.signature.toString().substring(2), "hex");
            // const oneSplitAddr = await recipeInstance.methods.OneSplitEHT_ADDR().call({
            //     from: owner
            // })

            await walletInstance.methods.invest(
                [tokenInstanceDAI._address,
                    tokenInstanceUSDC._address,
                    tokenInstanceCDAI._address,
                    tokenInstanceCUSDC._address
                ],
                [web3.utils.toWei('100'.toString(), 'ether'), 0, 0, 0],
                recipeInstance._address,
                proxyData,
                signature
            ).send({
                from: accounts[5],
                gas: 8000000
            })

            //1 DAI = 2 USDC, 3 cDAI, 4 cUSDC -> 100 DAI = 300cDAI -> 150 cDAI + 300 cUSDC = 150*200 + 300*100 swapToken
            const balance = await recipeInstance.methods.balances(walletInstance._address).call({
                from: owner
            })
            assert.equal(web3.utils.toWei('60000'.toString(), 'ether'), balance)
        });
    });

    describe("Redeem method", function() {
        it("Set rates on OneSplitETH", async function() {
            // 1 cDAI = 4 DAI, 1 cUSDC = 2 DAI
            await oneSplitInstance.setTokenRates(tokenInstanceCDAI._address, tokenInstanceDAI._address, 2, {
                from: owner
            });

            await oneSplitInstance.setTokenRates(tokenInstanceCUSDC._address, tokenInstanceDAI._address, 4, {
                from: owner
            });
        });
        it("Redeem DAI token via meta tx", async function() {
            //redeemAmount: uint256, recvToken: address, recvMinReturn: uint256, trade_dist: uint256[4], disableFlags: uint256
            const proxyDataEncoded = recipeInstance.methods.redeem(
                web3.utils.toWei('10000'.toString(), 'ether'),
                tokenInstanceDAI._address,
                100,
                [1, 2, 4, 3],
                0
            ).encodeABI();
            const proxyData = Buffer.alloc(484);
            const proxyDataBuffer = Buffer.from(proxyDataEncoded.substring(2), 'hex');
            proxyDataBuffer.copy(proxyData, 0, 0, proxyDataBuffer.length);
            //redeemToken: address, redeemAmount: uint256, recvToken: address, recvMinAmount: uint256, to: address, proxyData: bytes[484]
            const hashDataToSign = await walletInstance.methods.hashForRedeemMethod(
                tokenInstanceSwap._address,
                web3.utils.toWei('10000'.toString(), 'ether'),
                tokenInstanceDAI._address,
                100,
                recipeInstance._address,
                proxyData
            ).call({
                from: owner
            })
            const user1_privateK = "0x6c1b9d39801bb82b0f1f06657d193cf1cd736c210efe0a441b99acccfd822f50"
            const sign = await web3.eth.accounts.sign(hashDataToSign, user1_privateK);
            const signature = Buffer.from(sign.signature.toString().substring(2), "hex");

            const balaneBeforeRedeem = await tokenInstanceDAI.methods.balanceOf(walletInstance._address).call({
                from: owner
            })

            await walletInstance.methods.redeem(
                tokenInstanceSwap._address,
                web3.utils.toWei('10000'.toString(), 'ether'),
                tokenInstanceDAI._address,
                100,
                recipeInstance._address,
                proxyData,
                signature
            ).send({
                from: accounts[5],
                gas: 8000000
            })
            const balaneAfterRedeem = await tokenInstanceDAI.methods.balanceOf(walletInstance._address).call({
                from: owner
            })
            console.log(balaneAfterRedeem);
            
            const userSwapTokenBalance = await recipeInstance.methods.balances(walletInstance._address).call({
                from: owner
            })
            console.log(userSwapTokenBalance)
        });
    });

    // describe("Withdrawal method", function() {

    //     it("Set withdraw fee on Admin contract", async function() {
    //         // fee = 5 tokens
    //         await adminInstance.methods.changeWithDrawalFee(web3.utils.toWei('5'.toString(), 'ether')).send({
    //             from: owner
    //         });
    //     });

    //     it("Withdrawl 100 DAI to user2 address", async function() {

    //         const hashDataToSign = await walletInstance.methods.hashForWithDrawal(
    //             tokenInstanceDAI._address,
    //             web3.utils.toWei('100'.toString(), 'ether'),
    //             user2_EOA,
    //             adminInstance._address
    //         ).call({
    //             from: owner
    //         })
    //         const user1_privateK = "0x6c1b9d39801bb82b0f1f06657d193cf1cd736c210efe0a441b99acccfd822f50"
    //         const sign = await web3.eth.accounts.sign(hashDataToSign, user1_privateK);
    //         const signature = Buffer.from(sign.signature.toString().substring(2), "hex");

    //         //token: address, amount: uint256, to: address, admin: address, _sig: bytes[65]
    //         await walletInstance.methods.withDrawalToken(
    //             tokenInstanceDAI._address,
    //             web3.utils.toWei('100'.toString(), 'ether'),
    //             user2_EOA,
    //             adminInstance._address,
    //             signature
    //         ).send({
    //             from: owner,
    //             gas: 8000000
    //         })
    //         // withdrawal balance = 100 - 5 (fee)
    //         const withdrawBalance = await tokenInstanceDAI.methods.balanceOf(user2_EOA).call({
    //             from: owner
    //         });

    //         const adminBalance = await tokenInstanceDAI.methods.balanceOf(adminInstance._address).call({
    //             from: owner
    //         });
    //         assert.equal(web3.utils.toWei('95'.toString(), 'ether'), withdrawBalance)
    //         assert.equal(web3.utils.toWei('5'.toString(), 'ether'), adminBalance)
    //     });

    //     it("Admin withdrawal fee from Admin contract to external address", async function() {
    //         // fee = 5 tokens
    //         await adminInstance.methods.adminWithDrawal(
    //                 tokenInstanceDAI._address,
    //                 web3.utils.toWei('5'.toString(), 'ether'),
    //                 owner2)
    //             .send({
    //                 from: owner
    //             });

    //         const adminBalance = await tokenInstanceDAI.methods.balanceOf(adminInstance._address).call({
    //             from: owner
    //         });

    //         const ownerBalance = await tokenInstanceDAI.methods.balanceOf(owner2).call({
    //             from: owner
    //         });

    //         assert.equal(web3.utils.toWei('5'.toString(), 'ether'), ownerBalance)
    //         assert.equal(web3.utils.toWei('0'.toString(), 'ether'), adminBalance)
    //     });
    // });
});