# Igniter2.0

This tool is used to ignite ROFs or can also be used to rebalance a specific channel. 

## Prerequesites 
* NodeJS
* Own LND Node running with a Version not older than v0.11.0-beta (tested only on v0.13.1-beta)
* Installed ln-service [ln-service](https://github.com/alexbosworth/ln-service.git) how to is explained further in the text

## How to use the tool

The tool only conists of one javascript file igniter2_0.js. 

* Before you modify the script check whether your system has nodejs install typing the following in the terminal: `node --version` 
output should look something like this: `v14.17.5`
* Now we have to install ln-services type this in your terminal (for raspiblitz users with the admin user): `npm install ln-service`
* After successful installation (question see [ln-service](https://github.com/alexbosworth/ln-service.git)) we have to get the lnd tls and macaroon data from your node 
* Getting the tls.cert data and the admin.macaroon data we can do this either with the BoS (Balance of Satoshi) tool or with the commandline
* With the BoS tool its straightforward:
Type the following in cmdline (under the BoS user for raspiblitz): `bos credentials --cleartext`
* Now open igniter2_0.js and paste your data in the relevant line: 
````
const {lnd} = lnService.authenticatedLndGrpc({
  cert: 'tls.cert data',
  macaroon: 'admin.macaroon data',
  socket: '127.0.0.1:10009',
});
````
* Now you have to input the channelids you want to build a route through. Fill in either the `channelids_standardformat` for standard channelid format e.g. 697704x497x0
or `channelids_normalformat` for normal channelid format e.g. 767133660778397696
* Depending on your choice set the Boolean to the relevant value: `const channelstandarformat = true` for standard format and 
`const channelstandarformat = false` for normal format
* Depending how fast the gossip protocol is, if you set `const forcezerofee = true` the script will set all channel fee policies to zero (basefee = 0 and feerate = 0). 
This is the difference to the igniter1.0, now you will send a payment and you don't need to wait for the gossip protocol to propagate the fee-change. 
This does ONLY work if all participant of the ROF have their channelfees also set to zero. (Default this variable is set to false)
* Set the destination `  const destination = 'OWN NODE PUBLIC KEY'`
* Select the amount you want to send `const amount_sats = 10;`
* finally you have the choice to either just probe the network for this you have to set `const final_payment = false` or sent the final payment
then you have to set the variabel to `const final_payment = true`



