const mongoose=require('mongoose');
const schema=mongoose.Schema;

const whistlistSchema=new schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users'
    },
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'product'
    },
    product_name:{
        type:String
    },
    price:{
        type:Number
    }
})

module.exports=mongoose.model('whistlist',whistlistSchema)