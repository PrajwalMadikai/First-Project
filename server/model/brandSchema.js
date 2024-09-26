const mongoose=require('mongoose')
const schema=mongoose.Schema;

const brandSchema=new schema({
    name:{
        type:String
    },
    isBlock:{
        type:Boolean
    }
})

module.exports=mongoose.model('brand',brandSchema)