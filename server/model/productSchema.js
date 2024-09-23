let mongoose=require('mongoose')
const schema=mongoose.Schema
const imageUpload=new schema({
    title:{
        type:String,
        require:true
    },
    discount:{
        type:Number
    },
    expireAt:{
       type:Date
    },
    coupon_valid:{
        type:Boolean
    },
    category:{
        type:String,
    
    },
    brand:{
        type:String
    },
    stock:{
    type:Number
    },
    oldPrice:{
     type:Number
    },
    price:{
        type:Number,
    },
    isBlock:{
        type:Boolean
    },
    image:{
         image1:String,
         image2:String,
         image3:String
        
    },
    design:{
        type:String
    },
    fit:{
        type:String
    },
    occassion:{
        type:String
    },
    material:{
        type:String
    },
    createdAt:{
        type:Date,
        default:Date.now()
    } 
})
const products=mongoose.model("product",imageUpload)
module.exports=products
 