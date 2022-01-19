const ethers = require('ethers');
const secrets = require('../secrets.json');  //This contains an Endpoint URL, and a wallet private key


const provider = new ethers.providers.JsonRpcProvider(secrets.avax_wss);
const wallet = new ethers.Wallet(secrets.privateKey);
const signer = wallet.connect(provider);

console.log("Redeeming vested TIME for user: " + wallet.address);

const redeemContracts = new Map([
    ["TIME-AVAX LP Pair", '0xc26850686ce755FFb8690EA156E5A6cf03DcBDE1'],
    ["TIME-MIM LP Pair", '0xA184AE1A71EcAD20E822cB965b99c287590c4FFe'],
    ["wETH", '0x858636f350fc812c3c88d1578925c502727ab323']
  ]);

const redeemContractFunctions = [
    'function redeem( address _recipient, bool _stake ) external returns ( uint )',
    'function pendingPayoutFor( address _depositor ) external view returns ( uint pendingPayout_ )',
    'event BondRedeemed( address indexed recipient, uint payout, uint remaining )'
];

async function asyncForEach(bonds, callback) {
    for (var entry of bonds.entries()) {
        var key = entry[0],
            value = entry[1];
        await callback(value, key);
    }
}

async function redeemReceipt(redeemContract, bond_pair) {
    const myEventFilter = redeemContract.filters.BondRedeemed(wallet.address);
    redeemContract.once(myEventFilter, async (recipient, payout, remaining) => {
        redeemContract.off(myEventFilter);
        console.log("Redeemed " + ethers.utils.formatUnits(payout, 9) + " TIME from " + bond_pair);
        console.log("There is: " + ethers.utils.formatUnits(remaining, 9) + " TIME still vesting in " + bond_pair);
    })
}

async function redeemTIME(redeemContract, bond_pair) {
    const redeemTx = await redeemContract.redeem(wallet.address, true); // true = also stake the redeemed TIME
    redeemReceipt(redeemContract, bond_pair);
    await redeemTx.wait(); // Wait for the transaction to be mined before sending a new transaction
}

async function redeem() {
    const start = async () => {
        await asyncForEach(redeemContracts, async function(redeem_address, bond_pair) {
            console.log("Checking if there is TIME to redeem from " + bond_pair);
            const redeemContract = new ethers.Contract(
                redeem_address,
                redeemContractFunctions,
                signer
            );
    
            const pendingPayout = await redeemContract.pendingPayoutFor(wallet.address);
            const readablePayout = ethers.utils.formatUnits(pendingPayout, 9);
            console.log("There is " + readablePayout + " TIME to redeem from " + bond_pair);
    
            if (readablePayout > 0.001) {
                console.log("Redeeming minted TIME from " + bond_pair);
                await redeemTIME(redeemContract, bond_pair);
            } else {
                console.log("There is no TIME to redeem from " + bond_pair + " :(");
            }
        })
    }
    start();

    
}

async function main() {
    redeem();
}

main().then().finally(() => {});
