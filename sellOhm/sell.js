// After every rebase sell x% of the rebase for MIM on sushiswap
const contracts = require("./contracts");
const ethers = require('ethers');
const secrets = require('../secrets.json');


const rebasePercentDecimal = 0.006066; // Set vars for the rebase %
const percentToSell = 1; // Set var for the % of the rebase that we want to sell

console.log("Waiting for swap");

contracts.pairContract.on('error', (err) => {
    console.log(err.message)
});

// TODO: Finished on line 52 of oldbot.js
const getTradeAmounts = async () => {
    console.log("TEST");
    console.log((await(contracts.wMemoBalance())).toString());
    const wMEMOToSell = rebasePercentDecimal * percentToSell * await(contracts.wMemoBalance());
    // console.log(wMEMOToSell);
    const amounts = await contracts.sushiRouterContract.getAmountsOut(wMEMOToSell, [contracts.wMEMOAddress, contracts.mimAddress]); // Calculate the amount from a current trade
    console.log(ethers.utils.formatUnits(amounts[1],18)); // The amount of MIM we will receive from the trade
}
//getTradeAmounts();

const getTradeDetails = async () => {
    // Get data from the most recent swap
    console.log('Swap happened, considering trade...');
    await(getTradeAmounts());

    const pairData = await contracts.pairContract.getReserves();
    const MimReserves = ethers.utils.formatUnits(pairData[0], 18);
    const wMemoReserves = ethers.utils.formatUnits(pairData[1], 18);
    const conversion = Number(wMemoReserves) / Number(MimReserves);

    console.log(`
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    BlockTimeStamp: ${pairData[2]}
    wMEMO Reserve: ${wMemoReserves}
    MIM Reserve: ${MimReserves}
    wMEMO Price: ${conversion}
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    `)
    console.log('finishedSwap');
}
//getTradeDetails();

const checkTokenApproval = async (token, contract) => {
    const tokenAllowance = await(token.allowance(contract, contracts.signer.address));
    // console.log(tokenAllowance);
    return tokenAllowance;
}


const performTrade = async () => {
    await(getTradeDetails());
    // Perform a swap:
    const wMEMOAmountIn = ethers.utils.parseUnits('.0001', 18); // .0001 wMEMO // TODO: Pass in wMEMOToSell here instead of hardcoded value
    const amounts = await contracts.sushiRouterContract.getAmountsOut(wMEMOAmountIn, [contracts.wMEMOAddress, contracts.mimAddress]);
    const MIMamountOutMin = amounts[1].sub(amounts[1].div(200)); // Set 0.5% Slippage tolerance
    console.log(ethers.utils.formatUnits(MIMamountOutMin, 18));

    // Check if a token approval is required:
    const tokenApproval = await(checkTokenApproval(contracts.wMemoContract, contracts.sushiRouterAddress));
    if (tokenApproval < wMEMOAmountIn) {
        const approveTx = await contracts.wMemoContract.approve(
            contracts.sushiRouterContract,
            wMEMOAmountIn
        );
        let receipt = await approveTx.wait();
        console.log(receipt);
    }

    const tx = await contracts.sushiRouterContract.swapExactTokensForTokens(
        wMEMOAmountIn,
        MIMamountOutMin,
        [contracts.wMEMOAddress, contracts.mimAddress],
        wallet.address, // Send the swapped funds to our wallet
        Date.now() + 1000 * 60 * 2, // Max time for the trade to happen is 2 minutes
        {gasLimit: 250000}
    );
    const finishedSwap = await tx.wait();
    console.log('finishedSwap');
}
performTrade();