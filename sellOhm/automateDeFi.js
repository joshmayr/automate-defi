const ethers = require('ethers');

const AMMFactoryContractFunctions = [
    'function getPair(address tokenA, address tokenB) external view returns (address pair)'
];
const pairContractFunctions = [
    'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)',
    'function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)'
];
const routerContractFunctions = [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
];
const erc20ContractFunctions = [
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function balanceOf(address owner) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)'
];

const getTokenBalance = async (tokenContract, signer) => {
    const balance = await tokenContract.balanceOf(signer.address);
    return balance;
}

const getTradeAmounts = async (tokenBalance, tokenAContractAddress, tokenBContractAddress, router) => {
    const amounts = await router.getAmountsOut(tokenBalance, [tokenAContractAddress, tokenBContractAddress]); // Calculate the amount from a current trade
    console.log(ethers.utils.formatUnits(amounts[1], 18)); // The amount of MIM we will receive from the trade (This assumes an 18 decimal token)
}

const getTradingPairContract = async (tokenAContractAddress, tokenBContractAddress, routerContract) => {
    const tradingPairContractAddress = await routerContract.getPair(tokenAContractAddress, tokenBContractAddress);
    return tradingPairContractAddress;
}

const getTradeDetails = async (pairContract) => {
    // Get data from the most recent swap
    const pairData = await pairContract.getReserves();
    const tokenAReserves = ethers.utils.formatUnits(pairData[0], 18);
    const tokenBReserves = ethers.utils.formatUnits(pairData[1], 18);
    const conversion = Number(tokenBReserves) / Number(tokenAReserves);

    console.log(`
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    BlockTimeStamp: ${pairData[2]}
    Token B Reserve: ${tokenBReserves}
    Token A Reserve: ${tokenAReserves}
    wMEMO Price: ${conversion}
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    `)
}

const checkTokenApproval = async (token, contract, signer) => {
    const tokenAllowance = await(token.allowance(contract.address, signer.address));
    return tokenAllowance;
}

const approveTokenCheck = async (token, contract, signer, tokenAmount) => {
    const allowance = await checkTokenApproval(token, contract, signer);
    if (allowance < tokenAmount) {
        const approveTx = await token.approve(
            contract.address,
            tokenAmount
        );
        let receipt = await approveTx.wait();
        console.log(receipt);
        console.log("Approved token spend");
    } else {
        console.log("Token already approved");
    }
}



// TODO: Move checkTokenApproval out of this function so that we don't need routerContract and routerAddress, same with tokenAContract
const performTrade = async (wallet, tokenAContractAddress, tokenBContractAddress, tokenAParsedAmount, routerContract, routerAddress, tokenAContract) => {
    // Perform a swap:
    const tokenAAmountIn = ethers.utils.parseUnits('.0001', 18); // .0001 wMEMO // TODO: Pass in wMEMOToSell here instead of hardcoded value
    const amounts = await routerContract.getAmountsOut(tokenAParsedAmount, [tokenAContractAddress, tokenBContractAddress]);
    const tokenBAmountOutMin = amounts[1].sub(amounts[1].div(200)); // Set 0.5% Slippage tolerance
    console.log(ethers.utils.formatUnits(tokenBAmountOutMin, 18)); // Assumes an 18 decimal token

    const tx = await routerContract.swapExactTokensForTokens(
        tokenAParsedAmount,
        tokenBAmountOutMin,
        [tokenAContractAddress, tokenBContractAddress],
        wallet.address, // Send the swapped funds to our wallet
        Date.now() + 1000 * 60 * 2, // Max time for the trade to happen is 2 minutes
        {gasLimit: 250000}
    );
    await tx.wait();
    console.log('Finished Swap');
}

module.exports = { AMMFactoryContractFunctions, pairContractFunctions, routerContractFunctions, erc20ContractFunctions, getTokenBalance, getTradeAmounts, getTradingPairContract, getTradeDetails, checkTokenApproval, approveTokenCheck, performTrade };