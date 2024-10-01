const user=require('../model/userSchema')
const path=require('path')
const fileUpload=require('../model/productSchema')
const category=require('../model/categorySchema')
const product=require('../model/productSchema')
const Order=require('../model/order')
const User=require('../model/userSchema')
const Coupon=require('../model/coupon')
const mongoose=require("mongoose")
const Wallet=require('../model/wallet')
const Brand=require('../model/brandSchema')
 
 

exports.getUser = async (req, res) => {
    const currentPage = parseInt(req.query.page) || 1;  
    const itemsPerPage = 3;  

    const totalCustomers = await User.countDocuments();  
    const customers = await User.find().sort({ createdAt: 1 }).skip((currentPage - 1) * itemsPerPage).limit(itemsPerPage); 

    const totalPages = Math.ceil(totalCustomers / itemsPerPage);  
    res.render('./admin/users', { customers, currentPage, totalPages });
};

exports.block=async(req,res)=>{  
    try {
        await user.updateOne({_id: req.params.id},{$set:{isBlock:true}})
         res.redirect('/admin/user')
    } catch (error) {
        console.log(error);
        
    }
   
}
exports.unblock=async(req,res)=>{  
    try {
        await user.updateOne({_id: req.params.id},{$set:{isBlock:false}})
         res.redirect('/admin/user')
    } catch (error) {
        console.log(error);
        
    }
   
}

exports.delete=async(req,res)=>{
    try {
        await user.deleteOne({_id:req.params.id})
        req.flash('error',"User has been Deleted")
        res.redirect('/admin/user')
    } catch (error) {
        console.log(error);
        
    }
}
 
exports.loginGet=async(req,res)=>{
    try {
        if(req.session.admin)
        {
          res.redirect('/admin/user')
        }else{
        res.render('./admin/login')
        }
    } catch (error) {
        console.log(error);
        
    }
}

exports.loginPost=async(req,res)=>{
    try {
        const userData=await user.findOne({email:"admin@gmail.com"})

        if(!userData){
            res.render('./admin/login',{wrong:"No User or Password"})
        }

    if(req.body.password==userData.password && userData.isAdmin==true)
        {
            req.session.admin=req.body.email;
            res.redirect('/admin/user')
        }else{
            req.flash('wrong',"Wrong Password")
            res.redirect('/admin/login')
        }

    } catch (error) {
        console.log(error);
        
    }
}

exports.categoryBlock=async(req,res)=>{  
    try {
        const id=req.params.id
        await category.updateOne({_id: req.params.id},{$set:{isBlock:true}})
        // await product.updateMany({category:req.params.id},{$set:{isBlock:true}})
         res.redirect('/admin/category')
    } catch (error) {
        console.log(error);
        
    }
   
}

exports.categoryunBlock=async(req,res)=>{  
    try {
        await category.updateOne({_id: req.params.id},{$set:{isBlock:false}})
         res.redirect('/admin/category')
    } catch (error) {
        console.log(error);
        
    }
   
} 
exports.productBlock=async(req,res)=>{  
    try {
        await fileUpload.updateOne({_id: req.params.id},{$set:{isBlock:true}})
         res.redirect('/admin/product')
    } catch (error) {
        console.log(error);
        
    }
   
} 
exports.productUnblock=async(req,res)=>{  
    try {
        await fileUpload.updateOne({_id: req.params.id},{$set:{isBlock:false}})
         res.redirect('/admin/product')
    } catch (error) {
        console.log(error);
        
    }
   
} 

exports.loadBrands=async(req,res)=>{
    try {
        let brands=await Brand.find()
        res.render('./admin/brands',{brands})
        
    } catch (error) {
        console.log(error);
        
    }
}
exports.addBrands = async (req, res) => {
    try {
        const { brandName } = req.body;
        

        // Check if the brand already exists
        let existingBrand = await Brand.findOne({ name: brandName });
        if (existingBrand) {
            return res.json({ success: false, message: "Brand name already exists." });
        }

        // If not, create a new brand
        let newBrand = new Brand({
            name: brandName,
            isBlock: false
        });
        await newBrand.save();
        res.json({ success: true, message: "Brand Added" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "An error occurred." });
    }
};

exports.blockBrand=async(req,res)=>{
    try {
        let id=req.params.id
console.log();

        await Brand.findByIdAndUpdate(id,{
            $set:{isBlock:true}
        })
        res.redirect('/admin/brands')
    } catch (error) {
        console.log(error);
        
    }
}
exports.unblockBrand=async(req,res)=>{
    try {
        let id=req.params.id

        await Brand.findByIdAndUpdate(id,{
            $set:{isBlock:false}
        })
        res.redirect('/admin/brands')
    } catch (error) {
        console.log(error);
        
    }
}


exports.deleteBrand=async(req,res)=>{
    try {
        let id=req.params.id
        
        await Brand.findByIdAndDelete(id)
        res.redirect('/admin/brands')

    } catch (error) {
        console.log(error);
        
    }
}
exports.logout=async(req,res)=>{
    req.session.destroy((err)=>{
    if(err)
    {
        console.log("Session :"+err);
        
    }})
res.redirect('/admin/login')
}

exports.loadOrder=async(req,res)=>{
    try {
        const currentPage = parseInt(req.query.page) || 1;  
        const itemsPerPage = 6;  
        let totalOrders=await Order.countDocuments()

        let orders=await Order.find({}).skip((currentPage - 1) * itemsPerPage).limit(itemsPerPage);

        const totalPages = Math.ceil(totalOrders / itemsPerPage);

        res.render('./admin/orderList',{orders,currentPage,totalPages})
    } catch (error) {
        console.log(error);
        
    }
}

exports.cancelOrder = async (req, res) => {
    try {
        const productId = req.params.id;  
        const ObjectId =new mongoose.Types.ObjectId(productId);   

        await Order.updateOne(
            { 'products._id': ObjectId },  
            { $set: { 'products.$.status': "Cancelled" } }  
        );

        res.redirect('/admin/orderList');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error deleting order');
    }
}

exports.deliveredOrder=async(req,res)=>{
    try {
        const id=new mongoose.Types.ObjectId(req.params.id)

        await Order.updateOne(
            { 'products._id': id },  
            { $set: { 'products.$.status': "Delivered" } }  
        );

        res.redirect('/admin/orderList')
    } catch (error) {
        console.log(error);
        
    }
}

exports.approveReturn=async(req,res)=>{
    try {
        const id=new mongoose.Types.ObjectId(req.params.id)
        let user=await User.findOne({email: req.session.userAuth})

        const order = await Order.findOne({ 'products._id': id });

        await Order.updateOne(
            { 'products._id': id },  
            { $set: { 'products.$.status': "Returned" } }  
        )

        // Get the price of the product being returned
        const product = order.products.find(product => product._id.equals(id));
        const productPrice = product.price*product.quantity;
        if(order.discounted_price)
        {
            productPrice-=order.discounted_price
        }
        
  
         const wallet = await Wallet.findOne({ userId: user._id });
        
         
             wallet.balance +=Number(productPrice);
             await wallet.save();
          

        res.redirect('/admin/orderList')

    } catch (error) {
        console.log(error);
        
    }
}

exports.couponLoad=async(req,res)=>{
    try {
        let coupons=await Coupon.find()
        res.render("./admin/coupon",{coupons})
    } catch (error) {
        console.log(error);
        
    }
}

exports.addCoupon=async(req,res)=>{
    try {

        const { couponCode, discount, startDate, expiryDate, minimumAmount, maximumAmount, description } = req.body; 
        
        const existingCoupon = await Coupon.findOne({ 
            coupon_code: { $regex: new RegExp(`^${couponCode}$`, 'i') } 
        });
        
        if (existingCoupon) {
            return res.status(400).json({ message: 'Coupon with this code already exists.' });
        }

        const newCoupon = new Coupon({
            coupon_code: couponCode,    
            discount:discount,
            start_date: new Date(startDate),
            expiry_date: new Date(expiryDate),
            minimum_purchase_amount: minimumAmount,
            maximum_coupon_amount: maximumAmount,
            coupon_description: description
        });

        await newCoupon.save();

        res.status(201).json({ message: 'Coupon added successfully!' });

    } catch (error) {
        console.log(error);
        
    }
}

exports.offerLoad=async(req,res)=>{
    try {
        const currentPage = parseInt(req.query.page) || 1;  
        const itemsPerPage = 4;  

        
        let products=await fileUpload.find()
        let offerProductsList=await fileUpload.find({coupon_valid:true}).skip((currentPage - 1) * itemsPerPage).limit(itemsPerPage);
        const totalProductsCount = await fileUpload.countDocuments({ coupon_valid: true });
        
        const totalProductPages = Math.ceil(totalProductsCount / itemsPerPage);  

        let categories=await category.find()
        let offerCategoryList=await category.find({coupon_valid:true})
        let users=await user.find()
        res.render('./admin/offers',{products,offerProductsList,categories,offerCategoryList,user:users,currentPage,totalProductPages})
    } catch (error) {
        console.log(error);
        
    }
}

exports.productOffer = async (req, res) => {
    try {
        const { productId, discountPercentage, expirAt } = req.body;

        const product = await fileUpload.findById(productId);
        

        const categories = await category.findOne({ name: product.category });
        const categoryDiscount = categories.discount; // Ensure it's a number or default to 0

        // Ensure discountPercentage is a number
        const discount = Number(discountPercentage)  

        // Compare discountPercentage and categoryDiscount
        const effectiveDiscountPercentage = discount > categoryDiscount ? discount : categoryDiscount;
        console.log("highest:", effectiveDiscountPercentage);

         
        const discountAmount = (product.price * effectiveDiscountPercentage) / 100;
        const newPrice = product.price - discountAmount;

        await fileUpload.findByIdAndUpdate(productId, {
            $set: {
                oldPrice: Math.floor(product.price),
                price: Math.floor(newPrice),
                discount: effectiveDiscountPercentage,
                expireAt: expirAt,
                coupon_valid: true
            }
        });

        res.json({ success: true, message: "Product offer added successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error applying product offer" });
    }
};



exports.categoryOffer = async (req, res) => {
    try {
        const { categoryId, discountPercentage, expirAt } = req.body;
        

        await category.findByIdAndUpdate(categoryId, {
            $set: {
                discount: discountPercentage,
                expireAt: expirAt,
                coupon_valid: true
            }
        });

        

        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error applying category offer" });
    }
};

 

exports.deleteProductOffer = async (req, res) => {
    try {
        let id = req.params.id;
        const product = await fileUpload.findById(id); 

        if (product) {
            await fileUpload.findByIdAndUpdate(id, {
                $set: {
                    discount: "", 
                    coupon_valid: false,  
                    price: product.oldPrice 
                }
            });
            res.json({ success: true, message: "Offer removed and price reset" });
        } else {
            res.status(404).json({ success: false, message: "Product not found" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

exports.updateProductOffer = async (req, res) => {
    try {
        const { productId,name, discount, date } = req.body;

        const product = await fileUpload.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const categories = await category.find({ name: product.category });

        const categoryDiscount = categories.length > 0 ? categories[0].discount : 0;

        const effectiveDiscountPercentage = Number(discount) > Number(categoryDiscount) ? Number(discount) : Number(categoryDiscount);

        const discountAmount = (product.price * effectiveDiscountPercentage) / 100;
        const newPrice = product.price - discountAmount;

        await fileUpload.findByIdAndUpdate(productId, {
            $set: {
                title: name,
                discount: effectiveDiscountPercentage,
                price: Math.floor(newPrice),
                expireAt: date 
            }
        });

        res.json({ success: true, message: "Product offer updated successfully" });
    } catch (error) {
        console.log("Error during update:", error);
        res.status(500).json({ success: false, message: "Error updating product offer" });
    }
};


exports.deleteCategoryOffer=async(req,res)=>{
    try {
        let categoryId=req.params.id

        await category.findByIdAndUpdate(categoryId,
            {
                $set:
                {
                    coupon_valid:false,
                    discount:"",
                    expireAt:""
                }
            }
        )
        res.json({success:true,message:"Category Offer removed"})
        
    } catch (error) {
        console.log(error);
        
    }
}
exports.loadSalesReport = async (req, res) => {
    try {
        let totalOrders = await Order.countDocuments({ products: { $elemMatch: { status: 'Delivered' } }});

        let orders = await Order.find({ products: { $elemMatch: { status: 'Delivered' } }}).populate('products');

        let totalAmount = 0;
        
        orders.forEach(order => {
            order.products.forEach(product => {
                if (product.status === "Delivered") {
                    totalAmount += parseFloat(product.price) * parseInt(product.quantity);
                }
            });
        });

        let totalDiscount = orders.reduce((sum, order) => {
            const orderDiscount = order.discounted_price || 0;   
            return sum + orderDiscount;
        }, 0);

        res.render("./admin/salesReport", {
            orders,
            totalOrders,
            totalAmount,
            totalDiscount,
        });  
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred while loading the sales report.");
    }
};



exports.postSalesReport = async (req, res) => {
    const { filterType, startDate, endDate } = req.body;
    let dateFilter = {};
    
    const now = new Date();

    switch (filterType) {
        case 'daily':
            dateFilter = {
                orderDate: {
                    $gte: new Date(now.setHours(0, 0, 0, 0)),
                    $lt: new Date(now.setHours(23, 59, 59, 999))
                }
            };
            break;
            case 'weekly':
                const currentDate = new Date();   
                const dayOfWeek = currentDate.getDay();
                
                const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;  
                const firstDayOfWeek = new Date(currentDate);  
                firstDayOfWeek.setDate(currentDate.getDate() - daysToSubtract); 
                firstDayOfWeek.setHours(0, 0, 0, 0); 
            
                // Set the filter for the date range
                dateFilter = {
                    orderDate: {
                        $gte: firstDayOfWeek, // Monday at 00:00:00.000
                        $lt: new Date(currentDate.setHours(23, 59, 59, 999)) // End of the current day
                    }
                };
                break;
        case 'monthly':
            dateFilter = {
                orderDate: {
                    $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                    $lt: new Date(now.getFullYear(), now.getMonth() + 1, 0)
                }
            };
            break;
        case 'yearly':
            dateFilter = {
                orderDate: {
                    $gte: new Date(now.getFullYear(), 0, 1),
                    $lt: new Date(now.getFullYear(), 11, 31)
                }
            };
            break;
        case 'custom':
            if (startDate && endDate) {
                dateFilter = {
                    orderDate: {
                        $gte: new Date(startDate),
                        $lt: new Date(new Date(endDate).setHours(23, 59, 59, 999))
                    }
                };
            }
            break;
        default:
            dateFilter = {};
            break;
    }

    try {
        const orders = await Order.find({
            products: { $elemMatch: { status: 'Delivered' } },
            ...dateFilter  
        }).lean();

        const totalOrders = orders.length;

        let totalAmount = 0;
        
        orders.forEach(order => {
            order.products.forEach(product => {
                if (product.status === "Delivered") {
                    totalAmount += parseFloat(product.price) * parseInt(product.quantity);
                }
            });
        });

        const totalDiscount = orders.reduce((sum, order) => {
            return sum + (order.discounted_price || 0);   
        }, 0);
        

        res.json({
            success: true,
            orders,
            totalOrders,
            totalAmount,
            totalDiscount,
            filterType
        });
    } catch (error) {
        console.error('Error fetching sales report:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch sales report' });
    }
};

 