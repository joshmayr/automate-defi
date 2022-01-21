const ethers = require('ethers');
const automation = require("../sellOhm/automateDeFi");
const secrets = require('../secrets.json');

// Set variables:
const rebasePercentDecimal = 0.00606; // Set vars for the rebase %
const numDecimalsRebase = 5
const percentToSell = 1; // Set var for the % of the rebase that we want to sell
const numDecimalsSell = 0;

const provider = new ethers.providers.WebSocketProvider(secrets.avax_wss);
const wallet = new ethers.Wallet(secrets.privateKey);
const signer = wallet.connect(provider);

const sushiFactoryAddress = '0xc35DADB65012eC5796536bD9864eD8773aBc74C4';
const sushiRouterAddress = '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506';

const wMEMOAddress = '0x0da67235dd5787d67955420c84ca1cecd4e5bb3b';
const mimAddress = '0x130966628846bfd36ff31a822705796e8cb8c18d';
const wMemoMimPairAddress = '0x4d308C46EA9f234ea515cC51F16fba776451cac8';

// Setup contracts that we will use
const sushiFactoryContract = new ethers.Contract(
    sushiFactoryAddress,
    automation.AMMFactoryContractFunctions,
    signer
);

const sushiRouterContract = new ethers.Contract(
    sushiRouterAddress,
    automation.routerContractFunctions,
    signer
);

const wMemoMimPairContract = new ethers.Contract(
    wMemoMimPairAddress,
    automation.pairContractFunctions,
    signer
);

const wMemoContract = new ethers.Contract(
    wMEMOAddress,
    automation.erc20ContractFunctions,
    signer
);

const main = async () => {
    const tokenBalance = await automation.getTokenBalance(wMemoContract, signer); // wMemoContract
    const tokenAmountToTrade = tokenBalance.mul(rebasePercentDecimal * 10**numDecimalsRebase).mul(percentToSell*10**numDecimalsSell);
    await automation.getTradeAmounts(tokenAmountToTrade, wMEMOAddress, mimAddress, sushiRouterContract); // router contract
    await automation.getTradingPairContract(wMEMOAddress, mimAddress, sushiFactoryContract); // factory contract
    await automation.getTradeDetails(wMemoMimPairContract); // Get the current token reserves and trading price // wmemomim pair contract
    await automation.approveTokenCheck(wMemoContract, sushiRouterContract, signer, tokenAmountToTrade); // wMemoContract, routercontract
    await automation.performTrade(wallet, wMemoContract, mimAddress, tokenAmountToTrade, sushiRouterContract, sushiRouterAddress, wMEMOAddress); //wmemo contract, router contract
}
main();
// TODO: Listen for errors on all contracts that we use while they are active, stop listening after no longer needing the contracts
// TODO: Use contracts locally instead of having them be global variables.

