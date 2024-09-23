const mongoose=require('mongoose')
const schema=mongoose.Schema;

const addressField=new schema({
    userId:{
         type:mongoose.Schema.Types.ObjectId,
         ref:"users"
    },
    address:[
    { 
        name:{
        type:String,
       },
      houseName:{
        type:String,
      },
      city:{
        type:String,
      },
      state:{
        type:String,
      },
      district:{
        type:String,
      },
      pin:{
        type:String,
      },
      phone:{
        type:String,
      }
    
    }
    ]
});

module.exports=mongoose.model("address",addressField)