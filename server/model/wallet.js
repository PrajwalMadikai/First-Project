const mongoose=require('mongoose');
const schema=mongoose.Schema;

const walletschema=new schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users'
    },
    balance:{
        type:Number
    },
    credited:{
        type:Number
    }
})

module.exports=mongoose.model('wallet',walletschema)