let Wallet =require('../model/wallet')
let User=require("../model/userSchema")
const Razorpay = require('razorpay');

// Initialize Razorpay instance with key_id and key_secret
const razorpay = new Razorpay({
    key_id: process.env.razopay_keyId,
    key_secret: process.env.razopay_keySecret
});

exports.addAmount = async (req, res) => {
    try {
        const { amount } = req.body;
        const user = await User.findOne({ email: req.session.userAuth });

        const orderOptions = {
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1 // Auto capture payment
        };

        const razorpayOrder = await razorpay.orders.create(orderOptions);
        console.log("Razorpay order created:", razorpayOrder); // Log the order details

        // Send Razorpay order details to the frontend
        res.json({
            success: true,
            key: process.env.razorpay_keyId, // Razorpay Key
            amount: razorpayOrder.amount, // Amount in paise
            id: razorpayOrder.id // Razorpay Order ID
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ success: false, message: 'Error creating Razorpay order.' });
    }
};

// Verify payment
exports.verifyPaymentPOST = async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amount } = req.body;

    console.log(req.body, 'ksdjfaghasd2')
    const crypto = require("crypto");

    // Generate the expected signature to verify the payment
    const expectedSignature = crypto
        .createHmac("sha256", process.env.razopay_keySecret)
        .update(razorpayOrderId + "|" + razorpayPaymentId)
        .digest("hex");

    // Verify signature
    if (expectedSignature === razorpaySignature) {
        try {
            let user=await User.findOne({email:req.session.userAuth})
            const wallet = await Wallet.findOne({ userId: user._id });

            if (wallet) {
                // Update wallet balance (convert amount from paise to rupees)
                wallet.balance += parseFloat(amount) / 100;
                wallet.wallet_history.push({
                    date: new Date(),
                    amount: parseFloat(amount) / 100, // Save in rupees
                    description: "Funds added to wallet",
                    transactionType: "credited",
                });

                await wallet.save();
            }

            return res.status(200).json({
                success:true,
                message: "Payment verified successfully",
            });
        } catch (error) {
            console.error("Error updating wallet:", error);
            return res.status(500).json({
                message: "An error occurred while processing your payment. Please try again later."
            });
        }
    } else {
        return res.status(400).json({
            message: "Payment verification failed. Please check your payment details."
        });
    }
};