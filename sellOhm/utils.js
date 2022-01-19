const contracts = require('./contracts');

const wMemoBalance = async () => {
    const balance = await contracts.wMemoContract.balanceOf(contracts.signer.address);
    return balance;
}
wMemoBalance();

module.exports = { wMemoBalance };