let Cart=require('../model/addtoCart')
let User=require('../model/userSchema')
let Address=require('../model/address')
const Order=require('../model/order')
const Coupon=require('../model/coupon')
const Product=require('../model/productSchema')
const Razorpay=require('razorpay')
const mongoose=require('mongoose')
require('dotenv').config()

const razorpay=new Razorpay({
key_id:process.env.razopay_keyId,
key_secret:process.env.razopay_keySecret
})

exports.renderCheckout=async(req,res)=>{
    try {
        let user=await User.findOne({email: req.session.userAuth})
        let cart=await Cart.find({user_id:user._id}).populate('items.product_id')
        let addresses=await Address.find({userId:user._id})

        // Calculate total cart price
        let totalCartPrice = 0;
        cart.forEach(cartItem => {
            totalCartPrice += cartItem.items.reduce((sum, item) => sum + (item.product_id.price * item.quantity), 0);
        });
        
        let  coupons=await Coupon.find({minimum_purchase_amount:{$lte:totalCartPrice}})
        
        res.render('./user/checkOut',{cart,user,addresses,coupons})
    } catch (error) {
        console.log(error);
        
    }
}

async function updateProductStock(products, checkProducts) {
    for (let product of products) {
        let checkProduct = checkProducts.find(p => p._id.toString() === product.productId.toString());
        if (checkProduct) {
            let newStock = checkProduct.stock - product.quantity;
            await Product.updateOne({ _id: product.productId }, { $set: { stock: newStock } });
        }
    }
}

exports.placeOrder = async (req, res) => {
    try {
        const { addressId, paymentType,appliedCoupon} = req.body;
        
        let user = await User.findOne({ email: req.session.userAuth });
        let cart = await Cart.findOne({ user_id: user._id }).populate('items.product_id');
        
        // Make sure you have the updated total_price
        let totalPrice = cart.total_price
        console.log("new cart price:",totalPrice);
      

        let addressDoc = await Address.findOne({'address._id': addressId});
        let location = addressDoc.address.find(addr => addr._id.toString() === addressId.toString());
        let orderNumber = Math.floor(1000 + Math.random() * 9000);

        let products = cart.items.map(item => ({
            productId: item.product_id._id,
            image: item.product_id.image.image1,
            name: item.product_id.title,
            quantity: item.quantity,
            price: item.final_price
        }));

        let productIds = products.map(product => product.productId);
        let checkProducts = await Product.find({ _id: { $in: productIds } });

        let canProceed = products.every(product => {
            let checkProduct = checkProducts.find(p => p._id.toString() === product.productId.toString());
            return checkProduct && product.quantity <= checkProduct.stock;
        });

        if (canProceed) {
            let order = new Order({
                userId: user._id,
                orderNumber: orderNumber,
                deliveryAddress: addressDoc,
                paymentOption: paymentType,
                totalAmount: totalPrice, // Use the updated total price here
                products: products,
                coupon_name:appliedCoupon,
                address: [{
                    house: location.houseName,
                    city: location.city,
                    district: location.district,
                    state: location.state,
                    pin: location.pin,
                    phone: location.phone
                }]
            });

            // Handle Cash on Delivery (COD)
            if (paymentType === 'cod') {

               
                await order.save();
                await updateProductStock(products, checkProducts);
                await Cart.deleteOne({ user_id: user._id });

                return res.status(200).json({ message: 'Order placed successfully', cod: true });
            }

            // Handle Razorpay Payment
            if (paymentType === 'razor') {


                const razorpayOrder = await razorpay.orders.create({
                    amount: Number(order.totalAmount * 100), // Amount is in paise
                    receipt: order._id.toString(),
                    currency: 'INR'
                });
                await order.save();
                await updateProductStock(products, checkProducts);
                await Cart.deleteOne({ user_id: user._id });

                return res.status(200).json({
                    message: "Razorpay order created successfully",
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    razorpayOrderId: razorpayOrder.id,
                    razor: true,
                    key: process.env.razorpay_keyId
                });
            }
        } else {
            return res.status(400).json({ success: false, message: "Unable to proceed with the order. Product quantity exceeds stock." });
        }
    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

 
 
exports.orderHistory=async(req,res)=>{
    try {
        let user=await User.findOne({email: req.session.userAuth})
        let orders=await Order.find({userId:user._id}).populate('products.productId') 
        res.render('./user/orderHistory',{orders,user})
        
    } catch (error) {
        console.log(error);
        
    }
}

exports.removeAddress=async(req,res)=>{
    try {
        let id=req.params.id
        let user=await User.findOne({email:req.session.userAuth})
        await Address.findOneAndUpdate(
            { userId: user._id },
            {          
                $pull: {        
                    address: { _id: id }
                }
            }
        );
        res.json({success:true,message:"Address Deleted"})
    } catch (error) {
        console.log(error);
        
    }
}

exports.getupdateAddress=async(req,res)=>{
    try {
        const id=req.params.id
        let user=await User.findOne({email:req.session.userAuth})
        let info=await Address.findOne({userId:user._id,'address._id':id})
        
        res.render("./user/updateAddress",{info,user})
        
    } catch (error) {
        console.log(error);
        
    }
}

exports.updateAddress=async(req,res)=>{
    try {
        let id = req.params.id;
        let user = await User.findOne({ email: req.session.userAuth });
        
        if (!user) {
            return res.status(404).send('User not found');
        }

        await Address.findOneAndUpdate(
            { userId: user._id, 'address._id': id },
            {
                $set: {
                    'address.$.name': req.body.name,
                    'address.$.houseName': req.body.houseName,
                    'address.$.city': req.body.city,
                    'address.$.state': req.body.state,
                    'address.$.district': req.body.district,
                    'address.$.phone': req.body.phone,
                    'address.$.pin': req.body.pinCode
                }
            }
        );
        res.json({success:true,message:"Address Edited"})
        
    } catch (error) {
        console.log(error);
        
    }
}

exports.deleteOrder = async (req, res) => {
    try {
        const productId = req.params.id;  
        const ObjectId =new mongoose.Types.ObjectId(productId);   

        let user = await User.findOne({ email: req.session.userAuth });  
        let order = await Order.findOneAndUpdate(
            { userId: user._id, 'products._id': ObjectId },   
            {
                $pull: { products: { _id: ObjectId } }   
            },
            { new: true }  // Return the updated document
        );

        res.redirect('/orders');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error deleting order');
    }
}

exports.getOrderDetail=async(req,res)=>{
    try {
        const id=req.params.id
        let user=await User.findOne({ email: req.session.userAuth });
        let order=await Order.findOne({userId:user._id,'products._id':id})
        
        const product = order. products.find(p => p._id.toString() === id);
        
        res.render('./user/orderDetail',{order,user,product})
    } catch (error) {
        console.log(error);
        
    }
}

exports.returnProduct=async(req,res)=>{
    try {
        const id=req.params.id
        const reason=req.body.returnReason
        console.log("reason:",reason);
        
        let user=await User.findOne({ email: req.session.userAuth });
        await Order.updateOne({userId:user._id,'products._id':id},
            { $set: { 'products.$.request': true,'products.$.status':"Requested",'products.$.returnReason':reason} }
        )
        res.json({ success: true });
         
    } catch (error) {
        console.log(error);
        
    }
}
 
exports.cancelProduct=async(req,res)=>{
    try {
        const id=req.params.id
        const {returnReason,quantity}=req.body
        let stockInc=Number(quantity)
        console.log("prod Id:",id);
        
        let user=await User.findOne({ email: req.session.userAuth });

        await Product.findByIdAndUpdate(id,{
            $inc: { stock: stockInc } 
        })
        await Order.updateOne({userId:user._id,'products._id':id},
            { $set: { 'products.$.status':"Cancelled",'products.$.returnReason':returnReason} }
        )
        res.json({success:true,message:"successfull"})

    } catch (error) {
        console.log(error);
        
    }
}
exports.couponApply = async (req, res) => {
    try {
        let user = await User.findOne({ email: req.session.userAuth });

        let cart = await Cart.findOne({ user_id: user._id });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        let couponCode = req.body.couponID;  
        req.session.coupon = couponCode;

        let coupon = await Coupon.findOne({ coupon_code: req.session.coupon });
        if (!coupon) {
            return res.status(400).json({ message: "Invalid coupon" });
        }

        // Calculate the discount
        let discountPercentage = coupon.discount || 0; 
        let discountAmount = Math.floor((cart.total_price * discountPercentage) / 100) || 0;

        let maxCouponAmount = coupon.maximum_coupon_amount || 0; 
        if (discountAmount > maxCouponAmount) {
            discountAmount = maxCouponAmount;
        }

        console.log("Total Discount Amount:", discountAmount);

        // Get total cart price
        let totalCartPrice = cart.total_price || 0; 
        let products = cart.items;

        // Sort products by price descending
        products.sort((a, b) => b.price - a.price);

        let remainingDiscount = discountAmount;

        // Apply discount proportionally to each product
        products = products.map((product) => {
            let proportionateDiscount = (product.price / totalCartPrice) * discountAmount;

            let minPrice = 1; // Minimum price to apply
            let finalPrice = Math.max(product.price - proportionateDiscount, minPrice);

            let appliedDiscount = product.price - finalPrice;
            remainingDiscount -= appliedDiscount;

            // Update final_price for the product
            product.final_price = Math.floor(finalPrice);

            console.log(`Product: ${product.product_id}, Original Price: ${product.price}, Final Price: ${finalPrice}, Applied Discount: ${appliedDiscount}`);
            
            return {
                ...product,
                discounted_price: finalPrice,
                appliedDiscount 
            };
        });

        // Apply any remaining discount to the most expensive product
        if (remainingDiscount > 0 && products.length > 0) {
            products[0].final_price -= remainingDiscount; 
            products[0].final_price = Math.max(products[0].final_price, 1);
        }

        console.log("Products after discount:", products);

        // Update cart items with the final prices
        cart.items = products;

        // Calculate the new total price by subtracting the discount from the original total price
        let newTotalPrice = Math.max(totalCartPrice - discountAmount, 1); // Ensure total is at least 1

        // Log new total price
        console.log("New Total Price:", newTotalPrice);

        cart.total_price=newTotalPrice
        // Save the updated cart after updating total_price
        await cart.save();

        // Return the updated product prices and discount details
        res.status(200).json({
            message: "Coupon applied successfully",
            discountAmount: discountAmount,
            coupon_name: coupon.coupon_code,
            order_amount: newTotalPrice, // Use the updated total_price
            products // Return products with discounted prices
        });
    } catch (error) {
        console.error("Error applying coupon:", error);
        res.status(500).json({ message: "Server error" });
    }
};
