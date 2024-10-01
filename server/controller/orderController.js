let Cart=require('../model/addtoCart')
let User=require('../model/userSchema')
let Address=require('../model/address')
const Order=require('../model/order')
const Coupon=require('../model/coupon')
const Product=require('../model/productSchema')
const Razorpay=require('razorpay')
const mongoose=require('mongoose')
const Wallet = require('../model/wallet')
const puppeteer = require('puppeteer');
const path = require('path');

const razorpay=new Razorpay({
key_id:process.env.razopay_keyId,
key_secret:process.env.razopay_keySecret
})

exports.renderCheckout = async (req, res) => {
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
        let totalDiscount = cart.coupon_discount || 0;
      
        let addressDoc = await Address.findOne({'address._id': addressId});
        let location = addressDoc.address.find(addr => addr._id.toString() === addressId.toString());
        let orderNumber = Math.floor(1000 + Math.random() * 9000);

        let products = []; 

        let totalQuantity = cart.items.reduce((acc, item) => acc + item.quantity, 0);

        // Distribute the discount among products based on the total quantity
        let discountPerUnit = totalDiscount / totalQuantity;

        for (const item of cart.items) {
            const originalPrice = item.product_id.price;
            let discountedPrice = originalPrice * item.quantity; // Price * quantity for the product

            // Subtract the distributed discount from the total price of the product
            let totalProductDiscount = discountPerUnit * item.quantity;
            discountedPrice = Math.max(discountedPrice - totalProductDiscount, 0); // Ensure price doesn't go negative

            // Push the product with the discounted price to the products array
            products.push({
                productId: item.product_id._id,
                image: item.product_id.image.image1,
                name: item.product_id.title,
                quantity: item.quantity,
                price:Math.round(discountedPrice)
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

            // Handle Cash on Delivery (COD)
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

            // Handle Razorpay Payment
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

                    wallet.wallet_history.push({
                        date: Date.now(),
                        amount:cart.total_price,
                        transactionType: "Debit"
                    });
                    await wallet.save();
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
        const itemsPerPage = 5;  
        const totalOrders = await Order.countDocuments({ userId: user._id});  
        const orders = await Order.find({ userId: user._id })
        .populate('products.productId')    
        .sort({ orderDate: 1 })         
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
        let order=await Order.findOne({userId:user._id,'products._id':id}).populate('products.productId')
        
        const product = order.products.find(p => p._id.toString() === id);
        
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
        // Convert productId to ObjectId
        const productId =new mongoose.Types.ObjectId(req.params.id);  

        const { returnReason, quantity } = req.body;
        let stockInc = Number(quantity);
        console.log("reason:", returnReason);

        // Find the user based on session
        let user = await User.findOne({ email: req.session.userAuth });

        // Update product stock
        await Product.findByIdAndUpdate(productId, {
            $inc: { stock: stockInc }
        });
        
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
 

        res.json({ success: true, message: "Order cancelled successfully" });

    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ success: false, message: "Failed to cancel the order" });
    }
};



exports.couponApply = async (req, res) => {
    try {
         

        const user = await User.findOne({ email: req.session.userAuth });
         

        const cart = await Cart.findOne({ user_id: user._id }).populate('items.product_id');
        if (!cart || cart.items.length === 0) {
            return res.status(404).json({ message: "Cart not found or empty" });
        }

        let totalCartPrice = cart.total_price;  

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
exports.getInvoice = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findOne({ email: req.session.userAuth });
        const order = await Order.findOne({ userId: user._id, 'products._id': id });
        const product = order.products.find(p => p._id.toString() === id);
        let address=order.address[0]

        const htmlContent = `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .invoice-header { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
                    .address, .item-details, .totals { margin-bottom: 20px; }
                    .item-table { width: 100%; border-collapse: collapse; }
                    .item-table th, .item-table td { border: 1px solid black; padding: 8px; text-align: left; }
                    .totals { text-align: right; }
                </style>
            </head>
            <body>
                <div class="invoice-header">Invoice</div>
                
                <div class="address">
                    <h3>Shipping Address:</h3>
                    <p>${user.firstName}<br>
                    ${address.house}, ${address.city}, ${address.district} - ${address.pin}<br>
                    Phone: ${address.phone}<br>
                    Email: ${user.email}</p>
                </div>

                <div class="item-details">
                    <h3>Item Details:</h3>
                    <table class="item-table">
                        <tr>
                            <th>Order ID</th>
                            <th>Product Name</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Discount</th>
                            <th>Total</th>
                        </tr>
                        <tr>
                            <td>${order.orderNumber}</td>
                            <td>${product.name}</td>
                            <td>${product.quantity}</td>
                            <td>₹${product.price}</td>
                            <td>${order.discounted_price ?"₹"+order.discounted_price:"No Discount Applied"}</td>
                            <td>₹${product.price - order.discounted_price}</td>
                        </tr>
                    </table>
                </div>

                <div class="totals">
                    <p>Total Amount: ₹${order.totalAmount}<br>
                    Discount Amount: ${order.discounted_price ?'₹'+order.discounted_price:"No Discount Applied"}</p>
                </div>
            </body>
            </html>
        `;

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(htmlContent);
        const pdfFilePath = path.join(__dirname, 'invoices', `invoice.pdf`);
        await page.pdf({ path: pdfFilePath, format: 'A4' });

        await browser.close();

        // Send the PDF as response
        res.setHeader('Content-Disposition', `attachment; filename=invoice.pdf`);
        res.setHeader('Content-Type', 'application/pdf');
        res.download(pdfFilePath, (err) => {
            if (err) {
                console.error('Download error:', err);
            }
            
        });

    } catch (error) {
        console.log('Error occurred while downloading invoice:', error);
        res.status(500).json({ success: false, message: 'Server error occurred' });
    }
};