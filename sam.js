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

        // Calculate the discount amount for the entire cart
        let discountPercentage = coupon.discount;
        let totalCartDiscount = (cart.total_price * discountPercentage) / 100;

        let maxCouponAmount = coupon.maximum_coupon_amount;
        if (totalCartDiscount > maxCouponAmount) {
            totalCartDiscount = maxCouponAmount;
        }

        let remainingDiscount = totalCartDiscount; // Track the remaining discount amount
        console.log("Total discount amount:", totalCartDiscount);

        // Split the discount across products in the cart
        let products = cart.products; // Assuming cart.products is an array of product objects
        let totalProductPrice = products.reduce((sum, product) => sum + product.price, 0); // Total price of all products
        
        products.forEach(product => {
            // Calculate the proportion of discount for this product
            let productDiscount = (product.price / totalProductPrice) * totalCartDiscount;

            // Ensure product price does not go below zero
            if (productDiscount > product.price) {
                productDiscount = product.price; // Cap the discount at the product's price
            }

            // Reduce the product price by the discount amount
            product.price -= productDiscount;
            remainingDiscount -= productDiscount;

            console.log(`Product ${product._id} - Discount applied: ${productDiscount}, Remaining Discount: ${remainingDiscount}`);
        });

        // In case there's some remaining discount due to rounding, you can re-apply it if necessary
        // Adjust the total price in the cart
        cart.total_price -= totalCartDiscount;
        await cart.save();

        res.status(200).json({
            message: "Coupon applied successfully",
            newTotalPrice: Math.floor(cart.total_price),
            discountAmount: totalCartDiscount,
            coupon_name: coupon.coupon_code,
            products: cart.products // Send updated products with the new prices
        });
    } catch (error) {
        console.error("Error applying coupon:", error);
        res.status(500).json({ message: "Server error" });
    }
};
