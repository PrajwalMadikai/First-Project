const Cart = require('../model/addtoCart');
const Wishlist = require("../model/wishlist");

const cartMiddleware = async (req, res, next) => {
    try {
        let user =req.session.userId
        res.locals.user = user; 

        if (user) {
            let cart = await Cart.findOne({ user_id: user });
            res.locals.cart = cart;

            // Set the cart item count
            res.locals.cartCount = cart ? cart.items.length : 0; // Assuming items is an array in the Cart model
        } else {
            res.locals.cart = null;
            res.locals.cartCount = 0;
        }

        next();
    } catch (err) {
        console.error("Error in cart middleware:", err);
        next(err);
    }
};

const wishlistMiddleware = async (req, res, next) => {
    try {
        let user = req.session.userId
        res.locals.user = user; 

        if (user) {
            let wishlist = await Wishlist.findOne({ userId: user });
            res.locals.wishlist = wishlist;

            // Set the wishlist item count
            res.locals.wishlistCount = wishlist ? wishlist.items.length : 0; // Assuming items is an array in the Wishlist model
        } else {
            res.locals.wishlist = null;
            res.locals.wishlistCount = 0;
        }

        next();
    } catch (err) {
        console.error("Error in wishlist middleware:", err);
        next(err);
    }
};

module.exports = { cartMiddleware, wishlistMiddleware };
