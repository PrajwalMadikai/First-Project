const Whistlist=require('../model/whistlist')
const Product=require('../model/productSchema')
const User=require('../model/userSchema')

exports.loadWhistlist=async(req,res)=>{
    try {
        let user=await User.findOne({email:req.session.userAuth})
        let whistlist=await Whistlist.find({userId:user._id}).populate('productId')
        res.render('./user/whistlist',{whistlist,user})

    } catch (error) {
        console.log(error);
        
    }
}

exports.addWhistlist=async(req,res)=>{
    try{
        const {productId}=req.body
        console.log('product id:',productId);

        let user=await User.findOne({email:req.session.userAuth})
        let product=await Product.findOne({_id:productId})
        let whistlist=await Whistlist.findOne({userId:user._id,productId:product._id})
        console.log("whistlist:",whistlist);
        

        if(whistlist)
        {
            res.json({success:true,message:"Product Already in the Whistlist",oldItem:true})

        }else{

        let whistlistItem=new Whistlist({
            userId:user._id,
            productId:product._id,
            product_name:product.title,
            price:product.price
        })

        await whistlistItem.save()

        res.json({success:true,message:"Product added to Whistlist",newItem:true})
    }
        
    } catch (error) {
        console.log(error);
        
    }
}

exports.deleteWhistlist=async(req,res)=>{
    try {
         const {productId}=req.body
         console.log("backend:",productId);
         
         await Whistlist.findByIdAndDelete({productId:productId})

         res.json({success:true,message:"deleted"})

    } catch (error) {
        console.log(error);
        
    }
}