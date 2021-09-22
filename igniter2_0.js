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
  const channelids_standardformat = ['700884x458x1','700969x701x1','700887x1836x1','700869x192x0']

  const channelids_normalformat = ['758359558002245633','766558616202575873','759905471394152449']


  const pubkey_array = [{pub_key:'02826f50035eca93c7ebfbad4f9621a8eb201f4e28f994db5b6b5af32a65efb6b9', alias: 'hippiessabotage',fee_rate: 0,cltv_delta: 40}, //your own pubkey
                      {pub_key:'0305f5f4013f6c6eeb097bd8607204ec1f31577a05fae35f0d857c54d3b52e4e45' ,alias: 'ln.capital',fee_rate: 9,cltv_delta: 40},
                      {pub_key:'03127747aa9fb9b4813b7ebdd6ac47eb047954513ab06fe909689c2c42eaa49a33', alias: 'kcoinLND',fee_rate: 100,cltv_delta: 40},
                      {pub_key:'022d365c7719d22f28880ee8564acedf3bf6a401b3ca0ee28eeb1bd72700215b07', alias: 'ECB',fee_rate: 0,cltv_delta: 40},
                      {pub_key:'02826f50035eca93c7ebfbad4f9621a8eb201f4e28f994db5b6b5af32a65efb6b9', alias: 'hippiessabotage',fee_rate: 0}] //your own pubkey again


  console.log(channelids_normalformat)


  //Set this to false if you are using channelids in the normalformat
  const channelstandarformat = true

  //The gossip protocol is slow, with this variable your force zerofees of all channels
  const forcezerofee = false

  //Set Fees individually for channels

  const individualfee = false

  //set fees manually for every channel

  const manualfees = true


  //Destination PubKey, this is the public key of the node who ignites the channel
  const destination = '02826f50035eca93c7ebfbad4f9621a8eb201f4e28f994db5b6b5af32a65efb6b9'

  //amount to Send

  const amount_sats = 18050

  //set max fee you are willing to pay Default 100 ppm

  //const feerate = 100

  //or set to a specific value
  //const max_fee_sats =  feerate * Math.pow(10, -6) * amount_sats
  const max_fee_sats =  5000



  //Final Payment or Just Probing
  const final_payment = false

  // only available when individual_route = false
  const in_reverse = false



//=======================================Do not change anthing which come after this ======================================

  //Get Information of the Channels

  var routing_channels = []
  var channel = {}
  var id = ''

  if (channelstandarformat === true) {

    //console.log('Format of Channels is Standard e.g. 697722x1529x0')

    if (in_reverse){
      for (let i = channelids_standardformat.length-1; i>=0; i--) {
          channel = await getChannel({lnd,id: channelids_standardformat[i]})
          routing_channels.push(channel)


    }
  }
    else {
      for (let i = 0; i < channelids_standardformat.length; i++) {
          channel = await getChannel({lnd,id: channelids_standardformat[i]})
          routing_channels.push(channel)
          //console.log(channel.policies)
    }
  }


  }

  else {

    //console.log('Format of Channels is Normal Format e.g. 767153452055330816')

    if (in_reverse){
      for (let i = channelids_normalformat.length-1; i>=0; i--) {
        id = (await chanFormat({number: channelids_normalformat[i]})).channel
        console.log(id)
        channel = await getChannel({lnd,id})
        routing_channels.push(channel)

    }
  }
  else {

    for (let i = 0; i < channelids_normalformat.length; i++) {
        id = (await chanFormat({number: channelids_normalformat[i]})).channel
        console.log(id)
        channel = await getChannel({lnd,id})
        //console.log(channel)
        routing_channels.push(channel)
        //console.log(util.inspect(channel, {depth: null}));

    }

  }


  }

  //console.log(routing_channels)

  const hops = []


  if (individualfee === true){

    for (let i = 0; i < routing_channels.length; i++) {
      for (let j = 0; j < routing_channels[i].policies.length; j++) {
        if (routing_channels[i].policies[j].public_key === pubkey_array[i].pub_key){

          hop =   {
            channel:routing_channels[i].id ,
            channel_capacity: routing_channels[i].capacity,
            base_fee_mtokens:routing_channels[i].policies[j].base_fee_mtokens ,
            //cltv_delta:routing_channels[i].policies[j].cltv_delta ,
            fee_rate: pubkey_array[i].fee_rate,
            cltv_delta:pubkey_array[i].cltv_delta,
            public_key: pubkey_array[i+1].pub_key

          }
          //console.log('ppm: ' + 'ChanNumber' + i + routing_channels[i].policies[j].fee_rate )

          hops.push(hop)
        }
      }
    }
  }

  //  console.log(hops)



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

    routing_channels[6].policies[1].fee_rate = 1


  }


  const height = (await getHeight({lnd})).current_block_height;

  const mtokens = String(amount_sats * 1000);
  //console.log(mtokens)


  const invoice = await createInvoice({lnd,mtokens});
  console.log('==========================================')
  console.log('Invoice (do not share your secret!!!!):')
  console.log(invoice)
  console.log('==========================================')
  const payment = invoice.payment
  const imtokens = invoice.mtokens
  const id_payment = invoice.id



  if (forcezerofee === true || individualfee === false){

    var {route} = await routeFromChannels({channels: routing_channels ,destination,cltv_delta: 200, height: height ,messages:[], mtokens : imtokens,payment: payment, total_mtokens:imtokens});
    console.log(route)

}
  else if (individualfee === true){

  var route = await routeFromHops({cltv_delta: 200, height: height,initial_cltv: 40, hops:hops, messages:[],mtokens:imtokens,payment: payment,total_mtokens:imtokens} )

 console.log(route)

}


    console.log('Final Route: ')
    console.log(route)

    const max_fee_msats = max_fee_sats * 1000

    if(parseInt(route.fee_mtokens) <= max_fee_msats){

      console.log("Fee are good to go")
      console.log("Fees in sats: " + route.fee + " <= Fee Target: " + Math.round(max_fee_sats))
      console.log("Fees in msats: " + route.fee_mtokens + " <= Fee Target: " + max_fee_msats)


    }
    else{
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
      console.log("Success: Payment Preimage:" + payment_output)

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
    catch(err){
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

