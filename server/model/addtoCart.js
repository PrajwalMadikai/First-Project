const mongoose=require('mongoose');
const coupon = require('./coupon');
const schema=mongoose.Schema;
const Cart=new schema({
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users"
    },
    items:[
        {
        product_id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"product"
        },
        stock:{
            type:Number
        },
        quantity:{
            type:Number
        },
        price:{
            type:Number
        },
        final_price:{
            type:Number
        } 
    }
    ],
    total_price:{
        type:Number
    },
    coupon_name:{
        type:String
    },
    coupon_discount:{
        type:Number
    },
    isCoupon:{
        type:Boolean
    },
    createdAt:{
        type:Date,
        default:Date.now(),
        
    },
    expireAt:{
        type:Date,
    
    }
})
module.exports=mongoose.model("cart",Cart)