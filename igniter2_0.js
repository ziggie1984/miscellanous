//Igniter2.0

const {getChannel,getWalletInfo,authenticatedLndGrpc,createInvoice,getHeight,payViaRoutes} = require('ln-service');
const {chanFormat,routeFromChannels} = require('bolt07');
const util = require('util')


//===============================================================================



async function main() {

  //===========================Part to Change======================================


//use bos credentials --cleartext to get the data and paste it here
const {lnd} = await authenticatedLndGrpc({
  cert: 'tls.cert',
  macaroon: 'admin.macaroon',
  socket: '127.0.0.1:10009',
});



  //Fill all the channels separating by a comma; beginning with your channel
  //Standard Channel Format for example: 697722x1529x0
  const channelids_standardformat = ['707706x1090x0','707703x1491x1','707706x1090x0']

  //First ChannelID is the one from the Igniter Node to the next Peer
  //Last ChannelID is the channel to the Igniter Node

  const channelids_normalformat = ['780118893081853954','780177167338962945','780124390737707008','780150779012513792','780127689259548673']


  //In Case you want to set fees manually uncomment the array below, sometimes it can happen that the policies are not in
  //in your graph and are undefined. Then you can specifiy the fees (fake policy) normally set to 1000 mSat Basefee and 1 ppm feerate

  //When you don't use indiviualfee = true YOU DONT HAVE TO PUT IN THE PUBKEYS!!!!! ChannelIDS in the right order are SUFFICANT
  

const pubkey_array = [
                      {pub_key:'02826f50035eca93c7ebfbad4f9621a8eb201f4e28f994db5b6b5af32a65efb6b9', alias: '',fee_rate: 1,cltv_delta: 40,base_fee_mtokens: '1000'},
                      {pub_key:'0258adfbecc79c65f5d32ff0d7e9da6dc5e765140a8e8de7ed5ca0c6a4f6d37fb3', alias: '',fee_rate: 1,cltv_delta: 40,base_fee_mtokens: '1000'},
                      {pub_key:'02bc320249b608a53a76cf3cbd448fdd3ab8f3766f96e8649c2edc26cf03bf8277' ,alias: '',fee_rate: 1,cltv_delta: 40,base_fee_mtokens: '1000'},
                      {pub_key:'02b2d5b1e3167287ea4d1835e5272d99f7beb8c283f7a27d15198270630d3eb23a' ,alias: '',fee_rate: 1,cltv_delta: 40,base_fee_mtokens: '1000'},
                      {pub_key:'034997db2fa4563a86b0a06103944ad8eb5c2ff013e58afaa90f3de8a7bfd2b6d6', alias: '',fee_rate: 1,cltv_delta: 40,base_fee_mtokens: '1000'}
                    ]


  //Set Fees individually for channels

  const individualfee = false

  //Set this to false if you are using channelids in the normalformat
  const channelstandarformat = false

  //The gossip protocol is slow, with this variable your force zerofees of all channels
  const forcezerofee = false

  //Destination PubKey, this is the public key of the node who ignites the channel
  const destination = '02826f50035eca93c7ebfbad4f9621a8eb201f4e28f994db5b6b5af32a65efb6b9'

  //amount to Send

  const amount_sats = 1000000

  //set max fee you are willing to pay Default 100 ppm

  //const feerate = 100

  //or set to a specific value
  //const max_fee_sats =  feerate * Math.pow(10, -6) * amount_sats
  const max_fee_sats =  10

  //Final Payment or Just Probing
  const final_payment = false




//=======================================Do not change anthing which come after this ======================================

  //Get Information of the Channels

  var routing_channels = []
  var channel = {}
  var id = ''

  if (channelstandarformat === true)
  {

    //console.log('Format of Channels is Standard e.g. 697722x1529x0')
      for (let i = 0; i < channelids_standardformat.length; i++)
      {
          channel = await getChannel({lnd,id: channelids_standardformat[i]})
          routing_channels.push(channel)
          //console.log(channel.policies)

      }


  }

  else
  {


    for (let i = 0; i < channelids_normalformat.length; i++)
    {
        id = (await chanFormat({number: channelids_normalformat[i]})).channel
        //console.log(id)
        channel = await getChannel({lnd,id})
        //console.log(channel)
        routing_channels.push(channel)
        //console.log(util.inspect(channel, {depth: null}));

    }

  }

  //console.log(routing_channels)


  //Force Fees to Zero, if igniting a channel
  if (forcezerofee === true){
    console.log('Zerofee is forced')
    for (let i = 0; i < routing_channels.length; i++) {
        //onsole.log(channelids_standardformat[i]);
        routing_channels[i].policies[0].base_fee_mtokens = '0'
        routing_channels[i].policies[0].fee_rate = 0
        routing_channels[i].policies[1].base_fee_mtokens = '0'
        routing_channels[i].policies[1].fee_rate = 0

    }
    //console.dir(routing_channels)
    //console.log(util.inspect(routing_channels, {depth: null}));

  }




  const hops = []

  if (individualfee === true){


    for (let i = 0; i < routing_channels.length; i++) {
      for (let j = 0; j < routing_channels[i].policies.length; j++) {
        if (routing_channels[i].policies[j].public_key === pubkey_array[i].pub_key){

          hop =   {
            channel:routing_channels[i].id ,
            channel_capacity: routing_channels[i].capacity,
            base_fee_mtokens:pubkey_array[i].base_fee_mtokens ,
            fee_rate: pubkey_array[i].fee_rate,
            cltv_delta:pubkey_array[i].cltv_delta,
            public_key: pubkey_array[(i+1)%pubkey_array.length].pub_key

          }
          //console.log('ppm: ' + 'ChanNumber' + i + routing_channels[i].policies[j].fee_rate )

          hops.push(hop)
        }
      }
    }
  }

  //console.log(hops)



  const height = (await getHeight({lnd})).current_block_height;

  const mtokens = String(amount_sats * 1000);
  //console.log(mtokens)


  const invoice = await createInvoice({lnd,mtokens});
  //console.log('==========================================')
  //console.log('Invoice (do not share your secret!!!!):')
  //console.log(invoice)
  //console.log('==========================================')
  const payment = invoice.payment
  const imtokens = invoice.mtokens
  const id_payment = invoice.id

  if (forcezerofee === true || individualfee === false){

      var {route} = await routeFromChannels({channels: routing_channels ,destination,cltv_delta: 200, height: height ,messages:[], mtokens : imtokens,payment: payment, total_mtokens:imtokens});
      //console.log(route)

   }
  else if (individualfee === true){



      var route = await routeFromHops({cltv_delta: 200, height: height,initial_cltv: 40, hops:hops, messages:[],mtokens:imtokens,payment: payment,total_mtokens:imtokens} )


   }




  console.log('!!!!!!!!!!Final Route:!!!!!!!!!!!!!! ')
  console.log(route)

  const max_fee_msats = max_fee_sats * 1000

  if(parseInt(route.fee_mtokens) <= max_fee_msats){

      console.log("Fee are good to go")
      console.log("Fees in sats: " + route.fee + " <= Fee Target: " + Math.round(max_fee_sats))
      console.log("Fees in msats: " + route.fee_mtokens + " <= Fee Target: " + max_fee_msats)


    }
   else {
      console.log("Fee Target is too low")
      console.log("Fees in sats: " + route.fee + " > = Fee Target in sats: " + Math.round(max_fee_sats))
      console.log("Fees in msats: " + route.fee_mtokens + " >= Fee Target in msats: " + max_fee_msats)
      process.exit(1)
    }
   console.log('==========================================')



  if (final_payment === true){

    try{
      console.log("PayViaRoute")
      const payment_output = await payViaRoutes({lnd,id: id_payment, routes: [route]});
      console.log("Success: Payment Preimage:")
      console.log("%o", payment_output)

    }
    catch(err){
      var obj_str = util.inspect(err[2]);
      console.log("Error occured while paying")
      console.log(err[2].failures)
    }

  }

  else {
    try{
      const preimage = (await payViaRoutes({lnd, routes: [route]})).secret;

    }
    catch(err)
    {
      var obj_str = util.inspect(err[2]);

      //console.log(err[2].failures[0])
      //console.log(err)
      if (err[1] === 'UnknownPaymentHash'){

        console.log('A Route exists you can send the payment if you change const final_payment = true')
      }

      else {

        console.log('An Error ocurred check your input data: ')
        console.log(err[2].failures)


      }

    }

  }


}

main()
