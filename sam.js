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