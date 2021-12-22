# Igniter2.0

## This Project got an update, a real CMD-Tool you can find here ❗️❗️: [ringtooljs](https://github.com/lncapital/ringtooljs)

This tool is used to ignite ROFs or can also be used to rebalance a specific channel. With this tool you don't have to wait for the Gossip to propagate instead you can force 0 fees.

## Prerequesites 
* NodeJS
* Own LND Node running with a Version not older than v0.11.0-beta (tested only on v0.13.1-beta)
* Installed [ln-service](https://github.com/alexbosworth/ln-service.git) how to is explained further in the text
* Installed ln-service (how to is explained further in the text)
* Installed [Balanceofsatoshis](https://plebnet.wiki/wiki/Umbrel_-_Installing_BoS)

## How to use the tool

The tool only conists of one javascript file igniter2_0.js. 

* Login your node via Terminal (for umbrel users: ssh umbrel@umbrel.local and tap your password (will not show on the terminal) and tap enter)
* Before you modify the script check whether your system has nodejs installed typing the following in the terminal: `node --version` 
output should look something like this: `v14.17.5`
* If you do not have Balance of Satoshis, install [BOS](https://plebnet.wiki/wiki/Umbrel_-_Installing_BoS) (check link for procedure) 
* Now we have to install ln-services type this in your terminal (for raspiblitz users with the admin user): `npm install ln-service`
* After successful installation (question see [ln-service](https://github.com/alexbosworth/ln-service.git)) we have to get the lnd tls and macaroon data from your node 
* Now we need some information from your node:  `bos credentials --cleartext`
* Now open igniter2_0.js: `nano igniter2_0.js`. This will open the editor for the file in terminal. Locate the following text:

````
const {lnd} = lnService.authenticatedLndGrpc({
  cert: 'tls.cert data',
  macaroon: 'admin.macaroon data',
  socket: '127.0.0.1:10009',
});
````
* Replace the ‘tls.cert data’ & ‘admin.macaroon’ data with the information you got from BOS. It should look like this:

````
const {lnd} = lnService.authenticatedLndGrpc({
  cert: 'Lsgytgh454565…KL==',
  macaroon: 'GGFGHbjkghgj456456…TRy=',
  socket: '127.0.0.1:10009',
});
````

* Now that we have filled in your node info in the file, we need to input the channel-ids you want to build a route through. Fill in either the `channelids_standardformat` for standard channelid format e.g. `‘697704x497x0’` or `channelids_normalformat` for normal channelid format e.g. `‘767133660778397696’`. If you do not know the channel ids, go on 1ML to each node from your RingOfFire and find the channel created in the list on 1ML, you will see both ids (standard and normal)
NB: if you have a 3-node Route from your NodeA to a NodeB to a NodeC and back to your NodeA, the channels order should be:
`const channelids_standardformat = ['channel ID your NodeA to NodeB',' channel ID NodeB to NodeC ',' channel ID NodeC to your NodeA ']`

* Depending on your choice set the Boolean to the relevant value: const channelstandarformat = true for standard format and const channelstandarformat = false for normal format
* Depending how fast the gossip protocol is, if you set const forcezerofee = true the script will set all channel fee policies to zero (basefee = 0 and feerate = 0). This is the difference to the igniter1.0, now you will send a payment and you don't need to wait for the gossip protocol to propagate the fee-change. This does ONLY work if all participant of the RingOfFire have their channelfees also set to zero. (Default this variable is set to false)
* Set the destination const destination = 'YOUR OWN NODE PUBLIC KEY'
* Select the amount you want to send const `amount_sats = 10;`
* Set the maximum fee you are willing to pay `max_fee_sats = 1;` 
* Finally, you have the choice to either just probe the network for this you have to set const final_payment = false or sent the final payment then you have to set the variabel to const final_payment = true
* Close the editor: control+x then Y to save the file then Enter to validate same file name
* Excecute the script with the following command: `node igniter2_0.js` (ignore warnings)






