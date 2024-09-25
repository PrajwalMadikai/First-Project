const mongoose=require('mongoose');
const schema=mongoose.Schema;

const walletschema=new schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users'
    },
    balance:{
        type:Number,
        default:0
    },
    referral_code:{
        type:String
    },
    wallet_history:[
       {
         date:{
            type:Date
           },
           amount:{
            type:Number
           },
           description:{
            type:String
           },
           transactionType:{
            type:String
           }
       }
    ]
})

module.exports=mongoose.model('wallet',walletschema)