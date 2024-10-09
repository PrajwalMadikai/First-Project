let express=require('express');
let router=express.Router();
let controller=require("../controller/userController")
const passport = require('passport');
let isAuthenticate=require('../middleware/auth')
const cartController=require('../controller/cartController')
const profileController=require('../controller/profileController')
const orderController=require('../controller/orderController')
const whistlistController=require('../controller/whistlistController')
const walletController=require('../controller/walletController')
const isValid=require('../middleware/isBlock');

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
        // req.session.user=req.user._id 
        req.session.userAuth=req.user.email
        req.session.user = req.user.email;
        req.session.isBlock = req.user.isBlock;
        req.session.userInfo = req.user;
        req.session.userId = req.user._id;
        

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

//<------Home----->
router.get('/',controller.homeGet)

//  <-- Shirt -->
router.get('/shirt',controller.shirtGet)
router.get('/filter-products',controller.filterProduct)

//  <-- view product  -->
router.get('/product/:id',controller.viewProduct)

// <-- cart -->
router.get("/cart-items",isAuthenticate.isLogin,cartController.getCart)
router.post('/cart/:id',isAuthenticate.isLogin,cartController.addCart) 
router.post('/updateCart/:id',isAuthenticate.isLogin,cartController.updateCart) 
router.get('/deleteCart/:id',isAuthenticate.isLogin,cartController.deleteCart) 

//     <-- profile -->
router.get('/profile',isAuthenticate.isLogin,profileController.getProfile)
router.post('/edit-profile',isAuthenticate.isLogin,profileController.editProfile)
router.delete('/removeAddress/:id',isAuthenticate.isLogin,orderController.removeAddress)
router.get('/updateAddress/:id',isAuthenticate.isLogin,orderController.getupdateAddress)
router.post('/updateAddress/:id',isAuthenticate.isLogin,orderController.updateAddress)

//  <----- Address ------>
router.get('/address',isAuthenticate.isLogin,profileController.loadAddress)
router.post('/address',isAuthenticate.isLogin,profileController.postAddress)
router.get('/editAddress/:id',isAuthenticate.isLogin,profileController.getEditAddress)
router.post('/editAddress/:id',isAuthenticate.isLogin,profileController.postEditAddress)
router.post('/deleteAddress/:id',isAuthenticate.isLogin,profileController.deleteAddress)

//     <-- checkout page -->
router.get('/checkout',isAuthenticate.isLogin,orderController.renderCheckout)
router.post('/placeOrder',isAuthenticate.isLogin,orderController.placeOrder)
router.post('/verifyPayment',isAuthenticate.isLogin,orderController.verifyPayment)
router.post('/re-payment',isAuthenticate.isLogin,orderController.Repay)

router.get('/orders',isAuthenticate.isLogin,orderController.orderHistory)
router.get('/orderDetail/:id',isAuthenticate.isLogin,orderController.getOrderDetail)
router.post('/return/:id',isAuthenticate.isLogin,orderController.returnProduct)
router.post('/cancelOrder/:id',isAuthenticate.isLogin,orderController.cancelProduct)

//   <--------Rating--------->
router.post('/rate-product',isAuthenticate.isLogin,orderController.addRating)

//    <---  coupons  -->
router.post('/apply-coupon',isAuthenticate.isLogin,orderController.couponApply)
router.post('/remove-coupon',isAuthenticate.isLogin,orderController.removeCoupon)

//   <-- Wallet -->
router.post('/wallet-amount',isAuthenticate.isLogin,walletController.addAmount)
router.post('/wallet-veryfypayment',isAuthenticate.isLogin,walletController.verifyPaymentPOST)

//  <----Invoice---->
router.get('/download-invoice/:id',isAuthenticate.isLogin,orderController.getInvoice)
// <-- Whistlist -->
router.get('/wishlist',isAuthenticate.isLogin,whistlistController.loadWhistlist)
router.post('/wishlist/:id',isAuthenticate.isLogin,whistlistController.addWhistlist)
router.post('/wishlist-delete/:id',isAuthenticate.isLogin,whistlistController.deleteWhistlist)

router.get('/contact',profileController.getContact)
router.get('/about',profileController.getabout)

router.get('/logout',isAuthenticate.isLogin,controller.logout) 

 
 

module.exports=router;