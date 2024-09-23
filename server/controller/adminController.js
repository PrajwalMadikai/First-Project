const user=require('../model/userSchema')
const path=require('path')
const fileUpload=require('../model/productSchema')
const category=require('../model/categorySchema')
const product=require('../model/productSchema')
const Order=require('../model/order')
const User=require('../model/userSchema')
const Coupon=require('../model/coupon')
const mongoose=require("mongoose")
const Wallet=require('../model/wallet')
 
 

exports.getUser=async(req,res)=>{
    const customers = await user.aggregate([{$sort:{createdAt:1}}])
    res.render('./admin/users',{customers})
}

exports.block=async(req,res)=>{  
    try {
        await user.updateOne({_id: req.params.id},{$set:{isBlock:true}})
         res.redirect('/admin/user')
    } catch (error) {
        console.log(error);
        
    }
   
}
exports.unblock=async(req,res)=>{  
    try {
        await user.updateOne({_id: req.params.id},{$set:{isBlock:false}})
         res.redirect('/admin/user')
    } catch (error) {
        console.log(error);
        
    }
   
}

exports.delete=async(req,res)=>{
    try {
        await user.deleteOne({_id:req.params.id})
        req.flash('error',"User has been Deleted")
        res.redirect('/admin/user')
    } catch (error) {
        console.log(error);
        
    }
}
 
exports.loginGet=async(req,res)=>{
    try {
        if(req.session.admin)
        {
          res.redirect('/admin/user')
        }else{
        res.render('./admin/login')
        }
    } catch (error) {
        console.log(error);
        
    }
}

exports.loginPost=async(req,res)=>{
    try {
        const userData=await user.findOne({email:"admin@gmail.com"})

        if(!userData){
            res.render('./admin/login',{wrong:"No User or Password"})
        }

    if(req.body.password==userData.password && userData.isAdmin==true)
        {
            req.session.admin=req.body.email;
            res.redirect('/admin/user')
        }else{
            req.flash('wrong',"Wrong Password")
            res.redirect('/admin/login')
        }

    } catch (error) {
        console.log(error);
        
    }
}

exports.categoryBlock=async(req,res)=>{  
    try {
        const id=req.params.id
        await category.updateOne({_id: req.params.id},{$set:{isBlock:true}})
        // await product.updateMany({category:req.params.id},{$set:{isBlock:true}})
         res.redirect('/admin/category')
    } catch (error) {
        console.log(error);
        
    }
   
}

exports.categoryunBlock=async(req,res)=>{  
    try {
        await category.updateOne({_id: req.params.id},{$set:{isBlock:false}})
         res.redirect('/admin/category')
    } catch (error) {
        console.log(error);
        
    }
   
} 
exports.productBlock=async(req,res)=>{  
    try {
        await fileUpload.updateOne({_id: req.params.id},{$set:{isBlock:true}})
         res.redirect('/admin/product')
    } catch (error) {
        console.log(error);
        
    }
   
} 
exports.productUnblock=async(req,res)=>{  
    try {
        await fileUpload.updateOne({_id: req.params.id},{$set:{isBlock:false}})
         res.redirect('/admin/product')
    } catch (error) {
        console.log(error);
        
    }
   
} 

exports.logout=async(req,res)=>{
    req.session.destroy((err)=>{
    if(err)
    {
        console.log("Session :"+err);
        
    }})
res.redirect('/admin/login')
}

exports.loadOrder=async(req,res)=>{
    try {
        let orders=await Order.find({})
        res.render('./admin/orderList',{orders})
    } catch (error) {
        console.log(error);
        
    }
}

exports.cancelOrder = async (req, res) => {
    try {
        const productId = req.params.id;  
        const ObjectId =new mongoose.Types.ObjectId(productId);   

        await Order.updateOne(
            { 'products._id': ObjectId },  
            { $set: { 'products.$.status': "Cancelled" } }  
        );

        res.redirect('/admin/orderList');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error deleting order');
    }
}

exports.deliveredOrder=async(req,res)=>{
    try {
        const id=new mongoose.Types.ObjectId(req.params.id)

        await Order.updateOne(
            { 'products._id': id },  
            { $set: { 'products.$.status': "Delivered" } }  
        );

        res.redirect('/admin/orderList')
    } catch (error) {
        console.log(error);
        
    }
}

exports.approveReturn=async(req,res)=>{
    try {
        const id=new mongoose.Types.ObjectId(req.params.id)
        let user=await User.findOne({email: req.session.userAuth})

        const order = await Order.findOne({ 'products._id': id });

        await Order.updateOne(
            { 'products._id': id },  
            { $set: { 'products.$.status': "Returned" } }  
        )

        // Get the price of the product being returned
        const product = order.products.find(product => product._id.equals(id));
        const productPrice = product.price;  // Assuming price is a field in the product object
        console.log("returned price:", productPrice);
        
  
         const wallet = await Wallet.findOne({ userId: user._id });
        
         if (wallet) {
             wallet.balance +=Number(productPrice);
             await wallet.save();
         } else {
             const newWallet = new Wallet({
                 userId: user._id,
                 balance: productPrice  
             });
             await newWallet.save();
         }

        res.redirect('/admin/orderList')

    } catch (error) {
        console.log(error);
        
    }
}

exports.couponLoad=async(req,res)=>{
    try {
        let coupons=await Coupon.find()
        res.render("./admin/coupon",{coupons})
    } catch (error) {
        console.log(error);
        
    }
}

exports.addCoupon=async(req,res)=>{
    try {

        const { couponCode, discount, startDate, expiryDate, minimumAmount, maximumAmount, description } = req.body; 
        
        const existingCoupon = await Coupon.findOne({ 
            coupon_code: { $regex: new RegExp(`^${couponCode}$`, 'i') } 
        });
        
        if (existingCoupon) {
            return res.status(400).json({ message: 'Coupon with this code already exists.' });
        }

        const newCoupon = new Coupon({
            coupon_code: couponCode,    
            discount:discount,
            start_date: new Date(startDate),
            expiry_date: new Date(expiryDate),
            minimum_purchase_amount: minimumAmount,
            maximum_coupon_amount: maximumAmount,
            coupon_description: description
        });

        await newCoupon.save();

        res.status(201).json({ message: 'Coupon added successfully!' });

    } catch (error) {
        console.log(error);
        
    }
}

exports.offerLoad=async(req,res)=>{
    try {
        let products=await fileUpload.find()
        let offerProductsList=await fileUpload.find({coupon_valid:true})
        let categories=await category.find()
        let offerCategoryList=await category.find({coupon_valid:true})
        res.render('./admin/offers',{products,offerProductsList,categories,offerCategoryList})
    } catch (error) {
        console.log(error);
        
    }
}

exports.productOffer = async (req, res) => {
    try {
        const { productId, discountPercentage, expirAt } = req.body;

        // Fetch the product by ID
        const product = await fileUpload.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Fetch the category associated with the product
        const categories = await category.find({ name: product.category });
        const categoryDiscount = categories.length > 0 ? categories[0].discount : 0; // Get the category discount if it exists

        // Calculate the effective discount percentage
        const effectiveDiscountPercentage =Number(discountPercentage) + Number(categoryDiscount);
        

        // Calculate the new price after applying the effective discount
        const discountAmount = (product.price * effectiveDiscountPercentage) / 100;
        console.log("Discount Amount:", discountAmount);
        
        const newPrice = product.price - discountAmount;
        console.log("New Price:", newPrice);

        // Update the product with the new price and offer details
        await fileUpload.findByIdAndUpdate(productId, {
            $set: {
                oldPrice: Math.floor(product.price),
                price: Math.floor(newPrice),
                discount: effectiveDiscountPercentage,  
                expireAt: expirAt,
                coupon_valid: true
            }
        });

        res.json({ success: true, message: "Product offer added successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error applying product offer" });
    }
};

exports.categoryOffer = async (req, res) => {
    try {
        const { categoryId, discountPercentage, expirAt } = req.body;
        console.log('expu',expirAt);
        

        await category.findByIdAndUpdate(categoryId, {
            $set: {
                discount: discountPercentage,
                expireAt: expirAt,
                coupon_valid: true
            }
        });

        

        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error applying category offer" });
    }
};



exports.loadSalesReport=async(req,res)=>{
    try {
        let order=await Order.find({})
        res.render("./admin/salesReport",{order})
    } catch (error) {
        console.log(error);
        
    }
}