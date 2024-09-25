let express=require('express');
let router=express.Router();
let controller=require("../controller/userController")
let user=require("../model/userSchema")
const jwt = require('jsonwebtoken');
let mongoose=require('mongoose');
const passport = require('passport');
let isAuthenticate=require('../middleware/auth')
const cartController=require('../controller/cartController')
const profileController=require('../controller/profileController')
const orderController=require('../controller/orderController')
const productController=require('../controller/productController')
const whistlistController=require('../controller/whistlistController')
const walletController=require('../controller/walletController')
const isValid=require('../middleware/isBlock');
const order = require('../model/order');

router.get('/signup',controller.signGet)
router.post('/signup',controller.signPost)
router.get('/otp-page',controller.otpPage)
router.post('/otp-page',controller.otpPost)

router.get('/forgotpass',controller.forgotGet)
router.post('/forgotpass',controller.forgotPost)

router.get('/emailcode',controller.emailVerifyGet)
router.post('/emailcode',controller.emailVerifyPost)

router.get("/change-password",controller.newPassGet)
router.post("/change-password",controller.newPassPatch)

router.get('/otp-resent',controller.otpResent)
router.post('/otp-resent',controller.otpResentPost)
 
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
router.get('/auth/google/callback',passport.authenticate("google",{failureRedirect:'/signup'}),
async (req, res) => {
    try {
        req.session.user=req.user._id
        // Check if user is blocked
        if (req.session.user.isBlock === false) {
            res.redirect('/');
        } else {
            req.flash('wrong', 'You are blocked');
            res.redirect('/login');
        }
    }  catch (error) {
        console.log('Google OAuth Error:', error);
        res.redirect('/login');
    }
}
)
// login
router.get('/login',controller.loginGet)
router.post('/login',controller.loginPost)
//Home
router.get('/',controller.homeGet)

//  <-- Shirt -->

router.get('/shirt',controller.shirtGet)

//  <-- view product  -->

router.get('/product/:id',controller.viewProduct)

// <-- cart -->
router.get("/cart-items",isAuthenticate.isLogin,cartController.getCart)
router.post('/cart/:id',isAuthenticate.isLogin,isValid,cartController.addCart) 
router.post('/updateCart/:id',isAuthenticate.isLogin,isValid,cartController.updateCart) 
router.get('/deleteCart/:id',isAuthenticate.isLogin,isValid,cartController.deleteCart) 
//     <-- profile -->
router.get('/profile',isAuthenticate.isLogin,profileController.getProfile)
router.post('/edit-profile',isAuthenticate.isLogin,profileController.editProfile)
router.delete('/removeAddress/:id',isAuthenticate.isLogin,orderController.removeAddress)
router.get('/updateAddress/:id',isAuthenticate.isLogin,orderController.getupdateAddress)
router.post('/updateAddress/:id',isAuthenticate.isLogin,orderController.updateAddress)

router.get('/address',isAuthenticate.isLogin,profileController.loadAddress)
router.post('/address',isAuthenticate.isLogin,profileController.postAddress)
router.get('/editAddress/:id',isAuthenticate.isLogin,profileController.getEditAddress)
router.post('/editAddress/:id',isAuthenticate.isLogin,profileController.postEditAddress)
router.get('/deleteAddress/:id',isAuthenticate.isLogin,profileController.deleteAddress)
//     <-- checkout page -->
router.get('/checkout',isAuthenticate.isLogin,orderController.renderCheckout)
router.post('/placeOrder',isAuthenticate.isLogin,orderController.placeOrder)

router.get('/orders',isAuthenticate.isLogin,orderController.orderHistory)
router.get('/orderDetail/:id',isAuthenticate.isLogin,orderController.getOrderDetail)
router.post('/return/:id',isAuthenticate.isLogin,orderController.returnProduct)
router.post('/cancelOrder/:id',isAuthenticate.isLogin,orderController.cancelProduct)
//    <---  coupons  -->
router.post('/apply-coupon',isAuthenticate.isLogin,orderController.couponApply)

//   <-- Wallet -->
router.post('/wallet-amount',isAuthenticate.isLogin,walletController.addAmount)
router.post('/wallet-veryfypayment',isAuthenticate.isLogin,walletController.verifyPaymentPOST)

// <-- Whistlist -->
router.get('/whistlist',isAuthenticate.isLogin,whistlistController.loadWhistlist)
router.post('/whistlist/:id',isAuthenticate.isLogin,whistlistController.addWhistlist)
router.post('/whistlist-delete/:id',isAuthenticate.isLogin,whistlistController.deleteWhistlist)


 
 


router.get('/logout',isAuthenticate.isLogin,isValid,controller.logout) 

 
 

module.exports=router;