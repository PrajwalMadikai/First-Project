let express=require('express');
let router=express.Router();
let adminController=require("../controller/adminController")
const productController=require("../controller/productController")
const categoryController=require('../controller/categoryController')
let user=require("../model/userSchema")
const multer=require('../middleware/multer')
const isAdminAuth=require('../middleware/isAdmin')

router.get('/login',adminController.loginGet)
router.post('/login',adminController.loginPost)
 
 

router.get('/user',isAdminAuth,adminController.getUser)
router.get('/user/block/:id',isAdminAuth,adminController.block)
router.get('/user/unblock/:id',isAdminAuth,adminController.unblock)
router.delete('/user/delete/:id',isAdminAuth,adminController.delete)
 
//product
router.get('/product',isAdminAuth,productController.getProduct)
router.get('/addProduct',isAdminAuth,productController.getaddProduct)
router.post('/addProduct',isAdminAuth,multer.upload.fields([
    {name:'img1',maxCount:1},
    {name:'img2',maxCount:1},
    {name:'img3',maxCount:1}
]),productController.addProduct)
router.get('/product/edit/:id',isAdminAuth,productController.editProduct)
router.put('/product/edit/:id',isAdminAuth,multer.upload.fields([
    {name:'img1',maxCount:1},
    {name:'img2',maxCount:1}, 
    {name:'img3',maxCount:1}
]),productController.editProductPut)
router.delete('/product/delete/:id',isAdminAuth,productController.deleteProduct)

router.get('/product/block/:id',isAdminAuth,adminController.productBlock)
router.get('/product/unblock/:id',isAdminAuth,adminController.productUnblock)

router.get('/brands',isAdminAuth,adminController.loadBrands)

// //category

router.get('/category',isAdminAuth,categoryController.getCategory)
router.get('/category/edit/:id',isAdminAuth,categoryController.geteditCategory)
router.post('/category/edit/:id',isAdminAuth,categoryController.editCategory)
router.delete('/category/delete/:id',isAdminAuth,categoryController.deleteCategory)

router.get('/category/add',isAdminAuth,categoryController.addCategoryGet)
router.post('/category/add',isAdminAuth,categoryController.addCategory)

router.get('/category/block/:id',isAdminAuth,adminController.categoryBlock)
router.get('/category/unblock/:id',isAdminAuth,adminController.categoryunBlock)

// Order List
router.get("/orderList",isAdminAuth,adminController.loadOrder)
router.post('/cancelOrder/:id',isAdminAuth,adminController.cancelOrder)
router.post('/delivered/:id',isAdminAuth,adminController.deliveredOrder)
router.post('/approve/:id',isAdminAuth,adminController.approveReturn)
//  coupon
router.get('/coupon',isAdminAuth,adminController.couponLoad)
router.post('/add-coupon',isAdminAuth,adminController.addCoupon)

// offers
router.get('/offerManagment',isAdminAuth,adminController.offerLoad)
router.post('/offerManagment/addProductOffer',isAdminAuth,adminController.productOffer)
router.post('/offerManagment/addCategoryOffer',isAdminAuth,adminController.categoryOffer)
router.post('/deleteProductOffer/:id',isAdminAuth,adminController.deleteProductOffer)
router.post('/update-product-offer/:id',isAdminAuth,adminController.updateProductOffer)
router.post('/deleteCategoryOffer/:id',isAdminAuth,adminController.deleteCategoryOffer)

// sales report
router.get('/sales-report',isAdminAuth,adminController.loadSalesReport)


// logout 
router.get('/logout',adminController.logout)
 

module.exports=router;