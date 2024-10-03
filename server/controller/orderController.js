let Cart=require('../model/addtoCart')
let User=require('../model/userSchema')
let Address=require('../model/address')
const Order=require('../model/order')
const Coupon=require('../model/coupon')
const Product=require('../model/productSchema')
const Razorpay=require('razorpay')
const mongoose=require('mongoose')
const Wallet = require('../model/wallet')
require('dotenv').config()

const razorpay=new Razorpay({
key_id:process.env.razopay_keyId,
key_secret:process.env.razopay_keySecret
})

exports.renderCheckout = async (req, res) => {
    try {
        let user = await User.findOne({ email: req.session.userAuth });
        let cart = await Cart.findOne({ user_id: user._id }).populate('items.product_id');
        let addresses = await Address.find({ userId: user._id });

        // Initialize subtotal and totalCartPrice
        let subtotal = 0;
        let totalCartPrice = 0;

        // Calculate subtotal (sum of product price * quantity for each item)
        if (cart && cart.items.length > 0) {
            cart.items.forEach(item => {
                const itemPrice = item.product_id?.price; // Ensure price is defined and valid
               
                subtotal +=Number(itemPrice) * item.quantity;   // Add product price * quantity to subtotal
            });
        }

        // Set totalCartPrice as the subtotal initially
        totalCartPrice = Number(subtotal);

        

        // Fetch applicable coupons only if totalCartPrice is a valid number
        let coupons = [];
        if (totalCartPrice > 0) {
            coupons = await Coupon.find({ minimum_purchase_amount: { $lte: totalCartPrice } });
        }

        // Get applied coupon from session
        let appliedCoupon = [];
        let discountAmount = 0;

        if (req.session.coupon) {
            appliedCoupon = await Coupon.findOne({ coupon_code: req.session.coupon });

            if (appliedCoupon && totalCartPrice >= appliedCoupon.minimum_purchase_amount) {
                discountAmount = (totalCartPrice * appliedCoupon.discount) / 100;
                if (appliedCoupon.maximum_coupon_amount) {
                    discountAmount = Math.min(discountAmount, appliedCoupon.maximum_coupon_amount);
                }
                totalCartPrice -= discountAmount; // Update totalCartPrice after applying discount
            } else {
                req.session.coupon = null; // Clear invalid coupon
                appliedCoupon = []; // Clear applied coupon
                req.session.couponApplied = false; // Reset coupon applied flag
            }
        }

        // Render checkout page with updated coupon information
        res.render('./user/checkOut', {
            cart,
            user,
            addresses,
            coupons,
            appliedCoupon,
            totalCartPrice: totalCartPrice.toFixed(2), // Ensure 2 decimal places
            subtotal: subtotal.toFixed(2), // Ensure 2 decimal places
            discountAmount: discountAmount.toFixed(2) // Ensure 2 decimal places for discount amount
        });
    } catch (error) {
        console.log("Error rendering checkout:", error);
        res.status(500).send(`An error occurred: ${error.message}`);
    }
};



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
        const { addressId, paymentType, appliedCoupon } = req.body;
        
        let user = await User.findOne({ email: req.session.userAuth });
        let cart = await Cart.findOne({ user_id: user._id }).populate('items.product_id');
        
        // Make sure you have the updated total_price
        let totalPrice = cart.total_price;
        console.log("New cart price:", totalPrice);
      
        let addressDoc = await Address.findOne({'address._id': addressId});
        let location = addressDoc.address.find(addr => addr._id.toString() === addressId.toString());
        let orderNumber = Math.floor(1000 + Math.random() * 9000);

        let products = []; // Initialize an empty array to hold products

        for (const item of cart.items) {
            const originalPrice = item.product_id.price; // Assuming this is the original price
            let discountedPrice = originalPrice;

            // Check if a coupon is applied and calculate the discounted price
            if (appliedCoupon) {
                let coupon = await Coupon.findOne({ coupon_code: appliedCoupon });

                if (coupon) {
                    // Check if the cart's total price meets the minimum purchase amount for the coupon
                    if (totalPrice >= coupon.minimum_purchase_amount) {
                        // Calculate discount
                        let discountAmount = (originalPrice * coupon.discount) / 100;
                        if (coupon.maximum_coupon_amount) {
                            discountAmount = Math.min(discountAmount, coupon.maximum_coupon_amount);
                        }
                        discountedPrice = Math.max(originalPrice - discountAmount, 0); // Ensure discounted price is not negative
                    }
                }
            }

            // Push the product to the products array
            products.push({
                productId: item.product_id._id,
                image: item.product_id.image.image1,
                name: item.product_id.title,
                quantity: item.quantity,
                price: originalPrice,
                size:item.size
            });
        }

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
                coupon_name: appliedCoupon,
                discounted_price:cart.coupon_discount,
                address: [{
                    house: location.houseName,
                    city: location.city,
                    district: location.district,
                    state: location.state,
                    pin: location.pin,
                    phone: location.phone
                }]
            });

            if (paymentType === 'cod') {

                 

                await order.save();
                await updateProductStock(products, checkProducts);
                cart.items = [];
                cart.total_price=0
                cart.coupon_name=''
                cart.coupon_discount=''
                cart.isCoupon=false
                await cart.save(); 

                return res.status(200).json({ message: 'Order placed successfully', cod: true });
            }

            if (paymentType === 'razor') {
                const razorpayOrder = await razorpay.orders.create({
                    amount: Number(order.totalAmount * 100),  
                    receipt: order._id.toString(),
                    currency: 'INR'
                });
                await order.save();
                await updateProductStock(products, checkProducts);
                cart.items = [];
                cart.total_price=0
                cart.coupon_name=''
                cart.coupon_discount=''
                cart.isCoupon=false
                await cart.save(); 

                return res.status(200).json({
                    message: "Razorpay order created successfully",
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    razorpayOrderId: razorpayOrder.id,
                    razor: true,
                    key: process.env.razorpay_keyId
                });
            }

            if(paymentType=='wallet')
            {
                let wallet=await Wallet.findOne({userId:user._id})
                
                if(cart.total_price<=wallet.balance)
                {
                    wallet.balance-=cart.total_price;
                    await wallet.save()
                    await order.save();
                    await updateProductStock(products, checkProducts);
                    cart.items = [];
                    cart.total_price=0
                    cart.coupon_name=''
                    cart.coupon_discount=''
                    cart.isCoupon=false
                    await cart.save(); 

                    return res.status(200).json({ message: 'Order placed successfully', wallet: true });
                }else{
                    return res.status(200).json({ message: 'Order placed successfully', wallet: false });
                }

            }
        } else {
            return res.status(400).json({ success: false, message: "Unable to proceed with the order. Product quantity exceeds stock." });
        }
    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


 
exports.orderHistory = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.session.userAuth });
        const currentPage = parseInt(req.query.page) || 1;  
        const itemsPerPage = 4;  
        const totalOrders = await Order.countDocuments({ userId: user._id });  
        const orders = await Order.find({ userId: user._id })
            .populate('products.productId')
            .skip((currentPage - 1) * itemsPerPage)  
            .limit(itemsPerPage); // Limit to 5 items

        const totalPages = Math.ceil(totalOrders / itemsPerPage); // Calculate total pages

        res.render('./user/orderHistory', {
            orders,
            user,
            currentPage,
            totalPages
        });
    } catch (error) {
        console.log(error);
    }
};


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
 
exports.cancelProduct = async (req, res) => {
    try {
        const productId = req.params.id;  
        const { returnReason, quantity } = req.body;
        let stockInc = Number(quantity);
        console.log("reason:",returnReason);
        

        let user = await User.findOne({ email: req.session.userAuth });

        await Product.findByIdAndUpdate(productId, {
            $inc: { stock: stockInc }
        });

        await Order.updateOne(
            { userId: user._id, 'products.productId': productId },   
            {
                $set: {
                    'products.$.status': "Cancelled", 
                    'products.$.returnReason': returnReason
                }
            }
        );

        res.json({ success: true, message: "Order cancelled successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Failed to cancel the order" });
    }
};

exports.couponApply = async (req, res) => {
    try {
        if (!req.session.userAuth) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const user = await User.findOne({ email: req.session.userAuth });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const cart = await Cart.findOne({ user_id: user._id }).populate('items.product_id');
        if (!cart || cart.items.length === 0) {
            return res.status(404).json({ message: "Cart not found or empty" });
        }

        // Use the total_price stored in the cart
        let totalCartPrice = cart.total_price; // Already calculated total price from the cart

        const couponCode = req.body.couponID;
        const coupon = await Coupon.findOne({ coupon_code: couponCode });

        if (!coupon) {
            return res.status(400).json({ message: "Invalid coupon" });
        }

        

        // Calculate discount amount
        let discountAmount = (totalCartPrice * coupon.discount) / 100;
        if (coupon.maximum_coupon_amount) {
            discountAmount = Math.min(discountAmount, coupon.maximum_coupon_amount);
        }

        // Update total price after applying discount
        totalCartPrice -= discountAmount;

        // Update the cart with the discounted price and coupon info
        cart.total_price = totalCartPrice;
        cart.coupon_name = coupon.coupon_code;
        cart.coupon_discount = discountAmount;
        cart.isCoupon = true;
        await cart.save();

        res.json({
            success: true,
            message: "Coupon applied successfully",
            discountAmount: discountAmount.toFixed(2),
            coupon_name: coupon.coupon_code,
            order_amount: totalCartPrice.toFixed(2),
            appliedCoupon: {
                discount: discountAmount,
                coupon_code: coupon.coupon_code
            }
        });
    } catch (error) {
        console.error("Error applying coupon:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


exports.removeCoupon=async(req,res)=>{
    try {
        
    } catch (error) {
        console.log(error);
        
    }
}