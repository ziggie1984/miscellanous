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
  const channelids_standardformat = ['699867x1878x0','699868x1530x1','699804x759x1','699872x1648x1','699822x1842x1','699835x1781x1','699804x2310x0','699822x1818x1','699824x914x0',
                                    '699896x995x1', '699814x2050x1','699763x1732x1']

  
  //const channelids_normalformat = ['767153452055330816', '765827441025417217','767133660778397696','753717419910889472','767146855051362304']


  //Set this to false if you are using channelids in the normalformat
  const channelstandarformat = true

  //The gossip protocol is slow, with this variable your force zerofees of all channels
  const forcezerofee = false


  //Destination PubKey, this is the public key of the node who ignites the channel
  const destination = '02ba62f2cf65a10b9867477f266e67ef7e5f34b8b8b128916497bf54e0603a4693'

  //amount to Send

  const amount_sats = 10


  //Final Payment or Just Probing
  const final_payment = false



//=======================================Do not change anthing which come after this ======================================

  //Get Information of the Channels

  var routing_channels = []
  var channel = {}
  var id = ''

  if (channelstandarformat === true) {

    //console.log('Format of Channels is Standard e.g. 697722x1529x0')

    for (let i = 0; i < channelids_standardformat.length; i++) {
        channel = await getChannel({lnd,id: channelids_standardformat[i]})
        routing_channels.push(channel)
    }

    //console.log(routing_channels)

  }

  else {


    //console.log('Format of Channels is Normal Format e.g. 767153452055330816')

    for (let i = 0; i < channelids_normalformat.length; i++) {
        id = (await chanFormat({number: channelids_normalformat[i]})).channel
        //console.log(id)
        channel = await getChannel({lnd,id})
        //console.log(channel)
        routing_channels.push(channel)
        //console.log(util.inspect(channel, {depth: null}));

    }
    //console.log(routing_channels)

    //console.log(util.inspect(routing_channel_normal_format,{depth:null}))




  }



  //Force Fees to Zero, if igniting a channel
  if (forcezerofee === true){
    console.log('Zerofee is forced')
    for (let i = 0; i < routing_channels.length; i++) {
        //onsole.log(channelids_standardformat[i]);
        routing_channels[i].policies[0].base_fee_mtokens = 0
        routing_channels[i].policies[0].fee_rate = 0
        routing_channels[i].policies[1].base_fee_mtokens = 0
        routing_channels[i].policies[1].fee_rate = 0

    }
    //console.dir(routing_channels)
    //console.log(util.inspect(routing_channels, {depth: null}));

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


  let channels = []



    const res = await routeFromChannels({channels: routing_channels ,destination,cltv_delta: 300, height: height ,messages:[], mtokens : imtokens,payment: payment, total_mtokens:imtokens});


    const {route} = res;

    console.log('Final Route: ')
    console.log(route)
    console.log('==========================================')




  if (final_payment === true){

    try{
      console.log("PayViaRoute")
      const payment_output = await payViaRoutes({lnd,id: id_payment, routes: [route]});
      console.log("Success: Payment Preimage:" + payment_output)

    }
    catch(err){
      var obj_str = util.inspect(err[2]);

      console.log(err)
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

        console.log('An Error ocurred check your input data: ' + err)

      }

    }

  }


}

main()
