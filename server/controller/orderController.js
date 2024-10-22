let Cart=require('../model/addtoCart')
let User=require('../model/userSchema')
let Address=require('../model/address')
const Order=require('../model/order')
const Coupon=require('../model/coupon')
const Product=require('../model/productSchema')
const Razorpay=require('razorpay')
const mongoose=require('mongoose')
const Wallet = require('../model/wallet')
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const wallet = require('../model/wallet')
const { type } = require('os')
require('dotenv').config();

const razorpay=new Razorpay({
key_id:process.env.razopay_keyId,
key_secret:process.env.razopay_keySecret
})

exports.renderCheckout = async (req,res,next) => {
    try {
        let user = await User.findOne({ email: req.session.userAuth });
        let cart = await Cart.findOne({ user_id: user._id }).populate('items.product_id');
        let addresses = await Address.find({ userId: user._id });

        let subtotal = 0;
        let totalCartPrice = 0;

        if (cart && cart.items.length > 0) {
            cart.items.forEach(item => {
                const itemPrice = item.product_id?.price; // Ensure price is defined and valid
               
                subtotal +=Number(itemPrice) * item.quantity;    
            });
        }

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
                totalCartPrice -= discountAmount;  
            } else {
                req.session.coupon = null;  
                appliedCoupon = [];  
                req.session.couponApplied = false; 
            }
        }
        
        

        res.render('./user/checkOut', {
            cart,
            user,
            addresses,
            coupons,
            appliedCoupon,
            totalCartPrice: totalCartPrice, 
            subtotal: subtotal,  
            discountAmount: discountAmount  
        });
    } catch (error) {
        next(error)
        res.status(500).send(`An error occurred: ${error.message}`);
    }
};



async function updateProductStock(products, checkProducts) {
    try {
        for (let product of products) {
            let checkProduct = checkProducts.find(p => p._id.toString() === product.productId.toString());
            if (checkProduct) {
                let newStock = checkProduct.stock - product.quantity;
                // Only update if there's enough stock available
                if (newStock >= 0) {
                    await Product.updateOne({ _id: product.productId }, { $set: { stock: newStock } });
                } else {
                    throw new Error(`Not enough stock for product: ${checkProduct.title}`);
                }
            }
        }
    } catch (error) {
    
        throw error; // Propagate the error to the calling function
    }
}




exports.placeOrder = async (req,res,next) => {
    try {
        const { addressId, paymentType, appliedCoupon } = req.body;

        let user = await User.findOne({ email: req.session.userAuth });
        let cart = await Cart.findOne({ user_id: user._id }).populate('items.product_id');
        
        let totalPrice = cart.total_price;
        
        let totalDiscount = cart.coupon_discount || 0;

        let addressDoc = await Address.findOne({'address._id': addressId});
        let location = addressDoc.address.find(addr => addr._id.toString() === addressId.toString());
        let orderNumber = Math.floor(1000 + Math.random() * 9000);

        let products = []; 
        let totalQuantity = cart.items.reduce((acc, item) => acc + item.quantity, 0);
        let discountPerUnit = totalDiscount / totalQuantity;
        // checking if the admin is deleted the product
        for (let item of cart.items) {
            if (!item.product_id) {
                
                await Cart.updateOne(
                    { _id: cart._id },
                    { $pull: { items: { _id: item._id } } }
                );
        
                cart.total_price -= item.price * item.quantity;
                await cart.save();

                return res.status(200).json({ message: "Product not available", product: false });
            }
        }
            // Stock validation
            for (const item of cart.items) {
                const productId = item.product_id._id;
                const newproduct = await Product.findById(productId);  
            if (newproduct.stock < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for ${newproduct.title}. Available: ${newproduct.stock}, Required: ${item.quantity}` ,stock:false});
            }

             
        }
        

        for (const item of cart.items) {
            const originalPrice = item.product_id.price;
            let discountedPrice = originalPrice * item.quantity;
            let totalProductDiscount = discountPerUnit * item.quantity;
            discountedPrice = Math.max(discountedPrice - totalProductDiscount, 0);

            products.push({
                productId: item.product_id._id,
                image: item.product_id.image.image1,
                name: item.product_id.title,
                quantity: item.quantity,
                price: Math.round(discountedPrice),
               
            });
        }

        let order = new Order({
            userId: user._id,
            orderNumber: orderNumber,
            deliveryAddress: addressDoc,
            paymentOption: paymentType,
            totalAmount: totalPrice,
            products: products,
            coupon_name: appliedCoupon,
            discounted_price: cart.coupon_discount,
            delivery_charges:cart.delivery_charge,
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

                if(totalPrice >1000)
                {
                    console.log('below 100');
                    
                    return res.status(200).json({ message: 'Order placed successfully', cod: false });
                }
                order.products.forEach(product => {
                    product.paymentStatus = "Pending";
                });

                await order.save();
                await updateProductStock(products,cart.items.map(item => item.product_id));
                cart.items = [];
                cart.total_price=0
                cart.coupon_name=''
                cart.coupon_discount=''
                cart.isCoupon=false
                await cart.save(); 

                return res.status(200).json({ message: 'Order placed successfully', cod: true });
            }

            if (paymentType === 'razor') {

                totalPrice = Number(totalPrice);

                
                const razorpayOrder = await razorpay.orders.create({
                    amount: totalPrice * 100,  
                    receipt: order._id.toString(),
                    currency: 'INR'
                });

                order.products.forEach(product => {
                    product.razorpayOrderId = razorpayOrder.id;
                });

            await updateProductStock(products,cart.items.map(item => item.product_id));
            await order.save();
            cart.items = [];
            cart.total_price = 0;
            cart.coupon_name = '';
            cart.coupon_discount = '';
            cart.isCoupon = false;
            
            await cart.save();
            return res.status(200).json({
                razor: true,
                amount: razorpayOrder.amount,
                razorpayOrderId: razorpayOrder.id,
                key: process.env.razorpay_keyId,
                orderId:order._id
            });
             
        }

        if (paymentType === 'wallet') {
            let wallet = await Wallet.findOne({ userId: user._id });
            if (totalPrice <= wallet.balance) {
                wallet.balance -= totalPrice;
                await wallet.save();

                wallet.wallet_history.push({
                    date: Date.now(),
                    amount: totalPrice,
                    transactionType: "Debit"
                });
                await wallet.save();

                order.products.forEach(p => p.paymentStatus = "Success");
                await order.save();

              await updateProductStock(products, cart.items.map(item => item.product_id));
                 cart.items = [];
                cart.total_price = 0;
                cart.coupon_name = '';
                cart.coupon_discount = '';
                cart.isCoupon = false;
                await cart.save();

                return res.status(200).json({ wallet: true });
            } else {
                return res.status(200).json({ wallet: false });
            }
        }
    } catch (error) {
       next(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
 
 
exports.verifyPayment = async (req,res,next) => {
    try {
        const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

        // Check if payment failed (no signature means failure)
        if (!razorpaySignature) {
            let order = await Order.findOne({ 'products.razorpayOrderId': razorpayOrderId });

            if (order) {
                order.products.forEach(p => {
                    if (p.razorpayOrderId === razorpayOrderId) {
                        p.paymentStatus = 'Failed';  
                    }
                });
                await order.save();  
            }
            return res.status(400).json({ success: false, message: "Payment failed or canceled" });
        }

         

        const generatedSignature = crypto.createHmac('sha256', razorpay.key_secret)
                .update(razorpayOrderId + "|" + razorpayPaymentId)
                .digest('hex');


        
        let order = await Order.findOne({ 'products.razorpayOrderId': razorpayOrderId });

        if (generatedSignature === razorpaySignature) {
            console.log('Payment verification successful');
            order.products.forEach(p => {
                if (p.razorpayOrderId === razorpayOrderId) {
                    p.paymentStatus = 'Success';
                }
            });
            await order.save();
            return res.status(200).json({ success: true, message: "Payment verified successfully" });
        } else {
            order.products.forEach(p => {
                if (p.razorpayOrderId === razorpayOrderId) {
                    p.paymentStatus = 'Failed';
                }
            });
            await order.save();
            return res.status(400).json({ success: false, message: "Payment verification failed" });
        }
    } catch (error) {
      next(error)
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


 exports.Repay=async(req,res)=>{
    try {
        const {orderId}=req.body

        let order=await Order.findOne({_id:orderId})
        console.log('order',order);
        
        const razorpayOrder = await razorpay.orders.create({
            amount: Number(order.totalAmount * 100),
            receipt: order._id.toString(),
            currency: 'INR'
        });

        order.products.forEach(product => {
            product.razorpayOrderId = razorpayOrder.id;
        });
        await order.save()
        res.status(200).json({
            success: true,
            amount: razorpayOrder.amount,
            razorpayOrderId: razorpayOrder.id,
            key: process.env.razorpay_keyId,
            orderId: order._id
        });
        

    } catch (error) {
     next(error)
        
    }
 }
exports.orderHistory = async (req,res,next) => {
    try {
        const user = await User.findOne({ email: req.session.userAuth });
        const currentPage = parseInt(req.query.page) || 1;  
        const itemsPerPage = 3;  
        const totalOrders = await Order.countDocuments({ userId: user._id});  
        const orders = await Order.find({ userId: user._id })
        .populate('products.productId')    
        .sort({ orderDate: -1 })         
        .skip((currentPage - 1) * itemsPerPage)   
        .limit(itemsPerPage);             


        const totalPages = Math.ceil(totalOrders / itemsPerPage);  

        res.render('./user/orderHistory', {
            orders,
            user,
            currentPage,
            totalPages
        });
    } catch (error) {
     next(error)
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
     next(error)
        
    }
}

exports.getupdateAddress=async(req,res)=>{
    try {
        const id=req.params.id
        let user=await User.findOne({email:req.session.userAuth})
        let info=await Address.findOne({userId:user._id,'address._id':id})
        
        res.render("./user/updateAddress",{info,user})
        
    } catch (error) {
     next(error)
        
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
     next(error)
        
    }
}

exports.deleteOrder = async (req,res,next) => {
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
     next(error)
        res.status(500).send('Error deleting order');
    }
}

exports.getOrderDetail = async (req,res,next) => {
    try {
        const id = req.params.id;
        let user = await User.findOne({ email: req.session.userAuth });
        let order = await Order.findOne({ userId: user._id, _id: id })  


        res.render('./user/orderDetail', { order, user }); 
    } catch (error) {
     next(error)
        res.status(500).json({ message: "Internal Server Error" });
    }
};


exports.returnProduct=async(req,res)=>{
    try {
        const id=req.params.id
        const reason=req.body.returnReason
        console.log('reason:',reason);
        
        
        let user=await User.findOne({ email: req.session.userAuth });
        await Order.updateOne({userId:user._id,'products._id':id},
            { $set: { 'products.$.request': true,'products.$.status':"Requested",'products.$.returnReason':reason} }
        )
        res.json({ success: true });
         
    } catch (error) {
     next(error)
        
    }
}
 
exports.cancelProduct = async (req,res,next) => {
    try {
        // Convert productId to ObjectId
        const productId =new mongoose.Types.ObjectId(req.params.id);  
         
        const { returnReason, quantity,product } = req.body;
        let stockInc = Number(quantity);
       console.log('stock:',stockInc);
       

        // Find the user based on session
        let user = await User.findOne({ email: req.session.userAuth });

        // Update product stock
        await Product.findByIdAndUpdate(product, {
            $inc: { stock: stockInc }
        });
         
        let order=await Order.findOne({userId:user._id,'products._id': productId })
        const productInOrder = order.products.find(p => p._id.equals(productId));
        const price = productInOrder.price
 
        
       await Order.findOneAndUpdate(
            { 
                userId: user._id, 
                'products._id': productId  
            },   
            {
                $set: {
                    'products.$.status': "Cancelled", 
                    'products.$.returnReason': returnReason
                }
            },
        );
        let newWallet=await Wallet.findOne({userId:user._id})
         if(order)
         {
            newWallet.balance+=price
            newWallet.wallet_history.push({
                date: Date.now(),
                amount: price,
                transactionType: "Credit"
            })
            await newWallet.save()
         }
 
     
        res.json({ success: true, message: "Order cancelled successfully" });

    } catch (error) {
       next(error)
        res.status(500).json({ success: false, message: "Failed to cancel the order" });
    }
};

exports.addRating=async(req,res)=>{
    try {

       const {productId,rating}=req.body

       let user = await User.findOne({ email: req.session.userAuth });
       let product=await Product.findById(productId)

       if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      product.ratings.push({ userId:user._id, rating:rating });
      await product.save()
       console.log('rating added');
       
      res.json({success:true, message: 'Rating added successfully' });
    
    } catch (error) {
     next(error)
        
    }
}

exports.couponApply = async (req,res,next) => {
    try {
         

        const user = await User.findOne({ email: req.session.userAuth });
         

        const cart = await Cart.findOne({ user_id: user._id }).populate('items.product_id');
        if (!cart || cart.items.length === 0) {
            return res.status(404).json({ message: "Cart not found or empty" });
        }

        let totalCartPrice = cart.total_price + cart.delivery_charge;  

        const couponCode = req.body.couponID;
        const coupon = await Coupon.findOne({ coupon_code: couponCode });

        if (!coupon) {
            return res.status(400).json({ message: "Invalid coupon" });
        }

        

        let discountAmount = (totalCartPrice * coupon.discount) / 100;
        if (coupon.maximum_coupon_amount) {
            discountAmount = Math.min(discountAmount, coupon.maximum_coupon_amount);
        }

        totalCartPrice -= discountAmount;
        totalCartPrice-=cart.delivery_charge

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
        next(error)
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


exports.removeCoupon=async(req,res)=>{
    try {
        const user = await User.findOne({ email: req.session.userAuth });
        let cart=await Cart.findOne({user_id:user._id})
        cart.total_price+=cart.coupon_discount
        cart.coupon_name=''
        cart.isCoupon=false
        cart.coupon_discount=0
        await cart.save()
        res.json({success:true,message:"Coupon Removed"})
    } catch (error) {
     next(error)
        
    }
}
exports.getInvoice = async (req, res, next) => {
    try {
        console.log("Request params:", req.params); // Log request parameters

        const id = req.params.id;
        
        // Find user by email from session
        const user = await User.findOne({ email: req.session.userAuth });
        if (!user) {
            console.error("User not found");
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Find the order based on user ID and order ID
        const order = await Order.findOne({ userId: user._id, _id: id });
        if (!order) {
            console.error("Order not found");
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        let address = order.address[0];
        console.log("Address:", address); // Log address for verification

        // Create invoices directory if it doesn't exist
        const invoicesDir = path.join(__dirname, 'invoices');
        if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir, { recursive: true }); // Use recursive option for nested directories
        }

        const pdfFilePath = path.join(invoicesDir, `invoice_${id}.pdf`);

        // Initialize PDF document
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${id}.pdf`);
        res.setHeader('Content-Type', 'application/pdf');

        // Pipe the PDF to a file and the response
        doc.pipe(fs.createWriteStream(pdfFilePath));
        doc.pipe(res);

        // Write PDF content
        doc.fontSize(16).text('Invoice', { align: 'center' });
        doc.moveDown(1);

        // Shipping Address
        doc.fontSize(12).text('Shipping Address', { underline: true });
        doc.fontSize(10).text(`${user.firstName} ${user.lastName}`);
        doc.text(`${address.house}, ${address.city}, ${address.district} - ${address.pin}`);
        doc.text(`Phone: ${address.phone}`);
        doc.text(`Email: ${user.email}`);
        doc.moveDown(1);

        // Order Details Table
        doc.fontSize(12).text('Item Details', { underline: true });
        doc.moveDown(0.5);

        // Table Headers
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Order ID', { continued: true, width: 80 });
        doc.text('Product Name', { continued: true, width: 150 });
        doc.text('Quantity', { continued: true, width: 80 });
        doc.text('Price', { continued: true, width: 80 });
        if (order.discounted_price) {
            doc.text('Discount', { continued: true, width: 80 });
        }
        doc.text('Total', { align: 'left' });
        doc.moveDown(0.5);

        // Product Rows
        let totalAmount = 0;
        order.products.forEach(product => {
            const productTotal = (product.price - (order.discounted_price || 0)) * product.quantity;
            totalAmount += productTotal;

            doc.font('Helvetica').fontSize(9);
            doc.text(`${order.orderNumber}`, { continued: true, width: 80 });
            doc.text(`${product.name}`, { continued: true, width: 150 });
            doc.text(`${product.quantity}`, { continued: true, width: 80 });
            doc.text(`₹${product.price}`, { continued: true, width: 80 });
            if (order.discounted_price) {
                doc.text(`₹${order.discounted_price}`, { continued: true, width: 80 });
            }
            doc.text(`₹${productTotal}`, { align: 'left' });
            doc.moveDown(0.5);
        });

        // Totals Section
        const totalDiscount = order.discounted_price || 0;
        const deliveryCharge = order.delivery_charges || 0;
        const payableAmount = totalAmount + deliveryCharge - totalDiscount;

        doc.moveDown(1);
        doc.fontSize(10).text(`Total Amount: ₹${totalAmount.toFixed(2)}`, { align: 'right' });
        if (totalDiscount > 0) {
            doc.text(`Discount Amount: ₹${totalDiscount.toFixed(2)}`, { align: 'right' });
        }
        doc.text(`Delivery Charge: ₹${deliveryCharge.toFixed(2)}`, { align: 'right' });
        doc.text(`Paid Amount: ₹${payableAmount.toFixed(2)}`, { align: 'right' });

        // Footer Section
        doc.moveDown(2);
        doc.fontSize(8).text('Thank you for your purchase!', { align: 'center' });
        doc.text('trendView - Your trusted partner in quality.', { align: 'center' });

        // Finalize the PDF and end the stream
        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        console.error(error.stack);
        res.status(500).json({ success: false, message: 'Error generating PDF' });
    }
};