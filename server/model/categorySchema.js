const mongoose=require('mongoose')
const schema=mongoose.Schema;

const categorySchema=new schema({
      name:{
        type:String,
      },
      isBlock:{
        type:Boolean
      },
      discount:{
        type:Number
      },
      coupon_valid:{
        type:Boolean
      },
      expireAt:{
        type:Date
      }
})


module.exports=mongoose.model("category",categorySchema)
 