const mongoose=require('mongoose')
const schema=mongoose.Schema;

const order=new schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users'
    },
    orderNumber:{
        type:Number
    },
    delivaryAddress:{
        type:String
    },
    paymentOption:{
        type:String,
        enum:['cod','wallet','razor']
    },
    totalAmount:{
        type:Number
    },
    finalAmount:{
        type:Number
    },
    orderDate:{
        type:Date,
        default:Date.now()
    },
    expectedDelivary:{
        type:Date,
        default:Date.now()+7 * 24 * 60 * 60 * 1000
    },
    coupon_name:{
        type:String
    }, 
    discounted_price:{
        type:Number
    },
    delivery_charges:{
        type:Number
    },
    products:[
        {
            productId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'product'
            },
            image:{
               type:String
            },
            name:{
                type:String
            },
            quantity:{
                type:Number
            },
            price:{
                type:Number
            },
            status:{
                type:String,
                default:"Pending"
            },
            request:{
                type:Boolean
            },
            returnReason:{
                type:String
            },
            paymentStatus:{
                type:String
            },
            razorpayOrderId: {  
                type: String
            }
            
        }
    ],
    address:[
        {
            house:{
                type:String
            },
            city:{
                type:String
            },
            district:{
                type:String
            },
            state:{
                type:String
            },
            pin:{
                type:String
            },
            phone:{
                type:String
            }
        }
    ],
     

})

module.exports=mongoose.model('order',order)