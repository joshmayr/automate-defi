// After every rebase sell x% of the rebase for MIM on sushiswap
const ethers = require('ethers');
const secrets = require('../secrets.json');

const provider = new ethers.providers.WebSocketProvider(secrets.avax_wss);
const wallet = new ethers.Wallet(secrets.privateKey);
const signer = wallet.connect(provider);

const sushiFactoryAddress = '0xc35DADB65012eC5796536bD9864eD8773aBc74C4';
const sushiRouterAddress = '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506';

const wMEMOAddress = '0x0da67235dd5787d67955420c84ca1cecd4e5bb3b';
const mimAddress = '0x130966628846bfd36ff31a822705796e8cb8c18d';
const wMemoMimPair = '0x4d308C46EA9f234ea515cC51F16fba776451cac8';

const sushiFactoryContract = new ethers.Contract(
    sushiFactoryAddress,
    [
        'function getPair(address tokenA, address tokenB) external view returns (address pair)'
    ],
    signer
);

const pairContract = new ethers.Contract(
    wMemoMimPair,
    [
        'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)',
        'function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)'
    ],
    signer
);

const sushiRouterContract = new ethers.Contract(
    sushiRouterAddress,
    [
        'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
        'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
    ],
    signer
);

const wMemoContract = new ethers.Contract(
    wMEMOAddress,
    [
        'function approve(address spender, uint256 amount) external returns (bool)',
        'function balanceOf(address owner) view returns (uint256)',
        'function allowance(address owner, address spender) view returns (uint256)'
    ],
    signer
);

const wMemoBalance = async () => {
    const balance = await wMemoContract.balanceOf(signer.address);
    return balance;
}

module.exports = { pairContract, sushiRouterContract, wMemoContract, wMEMOAddress, mimAddress, provider, wallet, signer, sushiRouterAddress, wMemoBalance };