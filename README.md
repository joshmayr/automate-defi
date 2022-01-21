Walkthrough
Will work for most OHM-forks.
This was created for Wonderland, minting is no longer active there so the template code will need to be changed for whichever OHM-fork you are minting on.


Need to create secrets.json and add:
{
    avax_wss: rpc endpoint for avalanche
    privateKey: private key of the wallet address that is redeeming minted tokens
}


Will need to manually mint tokens
After the first time you mint tokens you will be able to find the contract address for that minting pair.
Access the blockchain explorer (for avalanche this is snowtrace.io), go to most recent transactions and find the contract address that you interacted with.
Add the contract to the redeemContracts map
Run the code.

Recommend you use a new wallet just for this program in the case of bugs.
Make sure that the wallet has some of the network's native coin in order to pay for transactions.

Sample scripts are located in the scripts folder
Community scripts are located in the community-scripts folder ***These have not been verified, use with caution***


Setup a cronjob on your machine that runs 5 minutes before every rebase.
55 */8 * * * node /home/.../ohm-minting-optimizer/redeem.js >> /home/.../ohm-minting-optimizer/log.txt
This runs the script at 0:55, 8:55, and 16:55 everyday. It also outputs the contents to log.txt in the same directory as the script.
Make sure that your machine is set to the appropriate timezone. If your machine is set to UTC and you set the cron task in your local timezone, the script will not run when you expect it to.


This code is provided as is and the creator is not responsible for any lose of funds.