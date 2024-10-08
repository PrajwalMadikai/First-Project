const mongoose=require('mongoose');

const schema=mongoose.Schema;

const trendView= new schema({
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:false
    },
    phone:{
        type:String
        
    },
    googleId:{
       type:String,
    //    unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:false
    },
    isBlock:{
        type:Boolean, 
        required:false
    }, 
    isAdmin:{
        type:Boolean,
        required:false
    },
    refferal_code:{
        type:String
    },
    used_refferal:{
        type:Number
    },
    expireAt:{
        type:Date
    },
    createdAt:{
        type:Date,
        default:Date.now()
    },
    updatedAt:{
        type:Date,
        default:Date.now()
    },
    
    
})

module.exports=mongoose.model('users',trendView)