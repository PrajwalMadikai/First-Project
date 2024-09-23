const mongoose=require('mongoose')
const schema=mongoose.Schema;

const couponSchema=new schema({
    coupon_code:{
        type:String,
        required:true,
        unique:true
    },
    discount:{
        type:Number,
        required:true
    },
    start_date:{
        type:Date,
        required:true
    },
    expiry_date:{
        type:Date,
        required:true
    },
    users:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users',
        defaul:[]
    }],
    minimum_purchase_amount:{
        type:Number,
        default:0
    },
    maximum_coupon_amount:{
        type:Number,
        default:0
    },
    coupon_description:{
        type:String,
        required:true
    }
})

module.exports=mongoose.model('coupon',couponSchema);