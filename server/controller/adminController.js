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
const { log } = require('console')
 
 

exports.getUser = async (req,res,next) => {
    try{
    const currentPage = parseInt(req.query.page) || 1;  
    const itemsPerPage = 3;  

    const totalCustomers = await User.countDocuments();  
    const customers = await User.find().sort({ createdAt: 1 }).skip((currentPage - 1) * itemsPerPage).limit(itemsPerPage); 

    const totalPages = Math.ceil(totalCustomers / itemsPerPage);  
    res.render('./admin/users', { customers, currentPage, totalPages });
    }catch(error)
    {
        next(error)
        
    }
};

exports.block=async(req,res,next)=>{  
    try {
        await user.updateOne({_id: req.params.id},{$set:{isBlock:true}})
         res.redirect('/admin/user')
    } catch (error) {
        next(error)
        
    }
   
}
exports.unblock=async(req,res,next)=>{  
    try {
        await user.updateOne({_id: req.params.id},{$set:{isBlock:false}})
         res.redirect('/admin/user')
    } catch (error) {
        next(error)
        
    }
   
}

exports.delete=async(req,res,next)=>{
    try {
        await user.deleteOne({_id:req.params.id})
        req.flash('error',"User has been Deleted")
        res.redirect('/admin/user')
    } catch (error) {
        next(error)
        
    }
}
 
exports.loginGet=async(req,res,next)=>{
    try {
        if(req.session.admin)
        {
          res.redirect('/admin/user')
        }else{
        res.render('./admin/login')
        }
    } catch (error) {
        next(error)
        
    }
}

exports.loginPost=async(req,res,next)=>{
    try {
        const userData=await user.findOne({isAdmin:true})
    
        if(!userData){
            res.render('./admin/login',{wrong:"Wrong User or Password"})
        }

    if(req.body.password==userData.password)
        {
        
            
            req.session.admin=req.body.email;
            res.redirect('/admin/dashboard')
        }else{
             
            
            req.flash('wrong',"Wrong Password")
            res.redirect('/admin/login')
        }

    } catch (error) {
        next(error)
        
    }
}

exports.categoryBlock=async(req,res,next)=>{  
    try {
        const id=req.params.id
        await category.updateOne({_id: req.params.id},{$set:{isBlock:true}})
        // await product.updateMany({category:req.params.id},{$set:{isBlock:true}})
         res.redirect('/admin/category')
    } catch (error) {
        next(error)
        
    }
   
}

exports.categoryunBlock=async(req,res,next)=>{  
    try {
        await category.updateOne({_id: req.params.id},{$set:{isBlock:false}})
         res.redirect('/admin/category')
    } catch (error) {
        next(error)
        
    }
   
} 
exports.productBlock=async(req,res,next)=>{  
    try {
        await fileUpload.updateOne({_id: req.params.id},{$set:{isBlock:true}})
         res.redirect('/admin/product')
    } catch (error) {
        next(error)
        
    }
   
} 
exports.productUnblock=async(req,res,next)=>{  
    try {
        await fileUpload.updateOne({_id: req.params.id},{$set:{isBlock:false}})
         res.redirect('/admin/product')
    } catch (error) {
        next(error)
        
    }
   
} 

exports.loadBrands=async(req,res,next)=>{
    try {
        let brands=await Brand.find()
        res.render('./admin/brands',{brands})
        
    } catch (error) {
        next(error)
        
    }
}
exports.addBrands = async (req,res,next) => {
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
        next(error)
        res.status(500).json({ success: false, message: "An error occurred." });
    }
};

exports.blockBrand=async(req,res,next)=>{
    try {
        let id=req.params.id
 

        await Brand.findByIdAndUpdate(id,{
            $set:{isBlock:true}
        })
        res.redirect('/admin/brands')
    } catch (error) {
        next(error)
        
    }
}
exports.unblockBrand=async(req,res,next)=>{
    try {
        let id=req.params.id

        await Brand.findByIdAndUpdate(id,{
            $set:{isBlock:false}
        })
        res.redirect('/admin/brands')
    } catch (error) {
        next(error)
        
    }
}


exports.deleteBrand=async(req,res,next)=>{
    try {
        let id=req.params.id
        
        await Brand.findByIdAndDelete(id)
        res.redirect('/admin/brands')

    } catch (error) {
        next(error)
        
    }
}
exports.logout=async(req,res,next)=>{
    req.session.destroy((err)=>{
    if(err)
    {
        console.log("Session :"+err);
        
    }})
res.redirect('/admin/login')
}

exports.loadOrder=async(req,res,next)=>{
    try {
        const currentPage = parseInt(req.query.page) || 1;  
        const itemsPerPage = 6;  
        let totalOrders=await Order.countDocuments()

        let orders=await Order.find({}).skip((currentPage - 1) * itemsPerPage).limit(itemsPerPage);

        const totalPages = Math.ceil(totalOrders / itemsPerPage);

        res.render('./admin/orderList',{orders,currentPage,totalPages})
    } catch (error) {
        next(error)
        
    }
}

exports.cancelOrder = async (req,res,next) => {
    try {
        const productId = req.params.id;  
        const ObjectId =new mongoose.Types.ObjectId(productId);   

        await Order.updateOne(
            { 'products._id': ObjectId },  
            { $set: { 'products.$.status': "Cancelled" } }  
        );

        res.redirect('/admin/orderList');
    } catch (error) {
        next(error)
        res.status(500).send('Error deleting order');
    }
}

exports.deliveredOrder=async(req,res,next)=>{
    try {
        const id=new mongoose.Types.ObjectId(req.params.id)
        const isCod=req.query.cod
        console.log(isCod);
        
        if(isCod)
        {
            await Order.updateOne(
                { 'products._id': id },  
                { $set: { 'products.$.status': "Delivered" ,'products.$.paymentStatus':"Success"} }  
            );
        }
        
        await Order.updateOne(
            { 'products._id': id },  
            { $set: { 'products.$.status': "Delivered" } }  
        );

        res.redirect('/admin/orderList')
    } catch (error) {
        next(error)
        
    }
}

exports.approveReturn=async(req,res,next)=>{
    try {
        const id=new mongoose.Types.ObjectId(req.params.id)
        let user=await User.findOne({email: req.session.userAuth})

        const order = await Order.findOne({ 'products._id': id });

        await Order.updateOne(
            { 'products._id': id },  
            { $set: { 'products.$.status': "Returned" } }  
        )

        // Get the price of the product being returned
        let product = order.products.find(product => product._id.equals(id));
        let productPrice = product.price*product.quantity;
        if(order.discounted_price)
        {
            productPrice-=order.discounted_price
        }
        if(product.paymentStatus=="Success"){
  
         const wallet = await Wallet.findOne({ userId: user._id });
        
         wallet.wallet_history.push({
            date: Date.now(),
            amount: productPrice,
            transactionType: "Credit"
        });
             wallet.balance +=Number(productPrice);
             await wallet.save();
        }

        res.redirect('/admin/orderList')

    } catch (error) {
        next(error)
        
    }
}

exports.couponLoad=async(req,res,next)=>{
    try {
        let coupons=await Coupon.find()
        res.render("./admin/coupon",{coupons})
    } catch (error) {
        next(error)
        
    }
}

exports.addCoupon=async(req,res,next)=>{
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
        next(error)
        
    }
}

exports.editCoupon=async(req,res,next)=>{
    try {
        let id =req.params.id
        let coupon=await Coupon.findOne({_id:id})
        res.render('./admin/editCoupon',{coupon})
    } catch (error) {
        next(error)
        
    }
}

exports.postEditCoupon = async (req,res,next) => {
    try {

        let { couponId, couponCode, description, discount, startDate, expiryDate, minimumAmount, maximumAmount } = req.body;


        await Coupon.findByIdAndUpdate(couponId, {
            $set: {
                coupon_code: couponCode,
                coupon_description: description,
                start_date: startDate,
                discount: discount,
                expiry_date: expiryDate,
                maximum_coupon_amount: maximumAmount,
                minimum_purchase_amount: minimumAmount
            }
        });

        res.json({ success: true, message: "Coupon updated successfully" });
    } catch (error) {
        next(error)
        res.status(500).json({ success: false, message: "An error occurred while updating the coupon." });
    }
};

exports.deleteCoupon=async(req,res,next)=>{
    try {
        let couponId=req.params.id

        await Coupon.findByIdAndDelete(couponId)
        res.json({success:true,message:'Coupon Deleted'})
    } catch (error) {
        next(error)
        
    }
}
exports.offerLoad=async(req,res,next)=>{
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
        next(error)
        
    }
}

exports.productOffer = async (req,res,next) => {
    try {
        const { productId, discountPercentage, expirAt } = req.body;

        const product = await fileUpload.findById(productId);
        
 

        const categories = await category.findOne({ name: product.category });
        const categoryDiscount = categories.discount ? categories.discount :0;  

        const discount = Number(discountPercentage)  

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
        next(error)
        res.status(500).json({ success: false, message: "Error applying product offer" });
    }
};



exports.categoryOffer = async (req,res,next) => {
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
        next(error)
        res.status(500).json({ success: false, message: "Error applying category offer" });
    }
};

 

exports.deleteProductOffer = async (req,res,next) => {
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
        next(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

exports.updateProductOffer = async (req,res,next) => {
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
        next(error)
        res.status(500).json({ success: false, message: "Error updating product offer" });
    }
};


exports.deleteCategoryOffer=async(req,res,next)=>{
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
        next(error)
        
    }
}
exports.loadSalesReport = async (req,res,next) => {
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
        next(error)
        res.status(500).send("An error occurred while loading the sales report.");
    }
};



exports.postSalesReport = async (req,res,next) => {
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
        next(error)
        res.status(500).json({ success: false, message: 'Failed to fetch sales report' });
    }
};

 
exports.getDashboard = async (req,res,next) => {
    try {
         
        
        const currentYear = new Date().getFullYear();

        let matchCondition = {
            "products.status": "Delivered",
            orderDate: {
                $gte: new Date(currentYear, 0, 1), // Start of the year
                $lt: new Date(currentYear + 1, 0, 1) // Start of next year
            }
        };

        const salesData = await Order.aggregate([
            { $match: matchCondition },
            { $unwind: "$products" },
            {
                $group: {
                    _id: { $month: "$orderDate" }, // Group by month
                    totalSales: { $sum: "$products.price" } // Sum of sales
                }
            },
            { $sort: { _id: 1 } } // Sort by month
        ]);
        // top 10 product
        const topProducts = await Order.aggregate([
            { $unwind: "$products" },
            {
                $group: {
                    _id: "$products.productId",  
                    name: { $first: "$products.name" },  
                    image: { $first: "$products.image" },  
                    totalOrdered: { $sum: "$products.quantity" } 
                }
            },
            { $sort: { totalOrdered: -1 } }, 
            { $limit: 10 } 
        ]);

        let topCategorys = await Order.aggregate([
            { $unwind: "$products" }, 
            {
                $lookup: {
                    from: "products", 
                    localField: "products.productId",  
                    foreignField: "_id", // Use _id instead of name
                    as: "productDetails"  
                }
            },
            { $unwind: "$productDetails" }, // Unwind the joined product details
            {
                $group: {
                    _id: "$productDetails.category",  // Use _id to group by category
                    totalOrdered: { $sum: "$products.quantity" }  // Sum the total ordered products
                }
            },
            { $sort: { totalOrdered: -1 } },  // Sort by total ordered products in descending order
            { $limit: 10 }  // Limit to top 10 categories
        ]);
        
        
        let topBrands = await Order.aggregate([
                    { $unwind: "$products" }, 
                    {
                        $lookup: {
                            from: "products", 
                            localField: "products.productId",  
                            foreignField: "_id", // Use _id instead of name
                            as: "brands"  
                        }
                    },
                    { $unwind: "$brands" }, // Unwind the joined product details
                    {
                        $group: {
                            _id: "$brands.brand",  // Use _id to group by brand
                            totalOrdered: { $sum: "$products.quantity" }  // Sum the total ordered products
                        }
                    },
                    { $sort: { totalOrdered: -1 } },  // Sort by total ordered products in descending order
                    { $limit: 10 }  // Limit to top 10 brands
                ]);


        // Prepare x-axis labels for months
        const labels = [
            "January", "February", "March", "April", "May", "June", 
            "July", "August", "September", "October", "November", "December"
        ];

        // Create an array to hold monthly sales data
        const totalSalesData = new Array(labels.length).fill(0);
        salesData.forEach(data => {
            totalSalesData[data._id - 1] = data.totalSales; // Fill the corresponding month index
        });

        res.render('./admin/dashboard', { salesData: totalSalesData, labels, selectedTimeframe: 'monthly',topProducts,topCategorys,topBrands });
    } catch (error) {
        next(error)
        res.status(500).send("Server Error");
    }
};
exports.updateGraphData = async (req,res,next) => {
    try {
        const { timeframe } = req.query; // Get timeframe from query params
        const currentYear = new Date().getFullYear();
        const currentDate = new Date(); // Current date for week calculation

        // Match condition for delivered products
        let matchCondition = {
            "products.status": "Delivered",
            orderDate: {
                $gte: new Date(currentYear, 0, 1), // Start of the year
                $lt: new Date(currentYear + 1, 0, 1) // Start of next year
            }
        };

        let salesData;

        // Aggregate sales data based on the selected timeframe
        if (timeframe === 'monthly') {
            salesData = await Order.aggregate([
                { $match: matchCondition },
                { $unwind: "$products" },
                {
                    $group: {
                        _id: { $month: "$orderDate" }, // Group by month
                        totalSales: { $sum: "$products.price" } // Sum of sales
                    }
                },
                { $sort: { _id: 1 } } // Sort by month
            ]);
        } else if (timeframe === 'weekly') {
            // Get start of the current week (Sunday)
            const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 7); // End of the current week (next Sunday)

            matchCondition.orderDate = {
                $gte: startOfWeek,
                $lt: endOfWeek
            };

            // Aggregate sales data grouped by day of the week
            salesData = await Order.aggregate([
                { $match: matchCondition },
                { $unwind: "$products" },
                {
                    $group: {
                        _id: { $dayOfWeek: "$orderDate" }, // Group by day of the week
                        totalSales: { $sum: "$products.price" } // Sum of sales
                    }
                },
                { $sort: { _id: 1 } } // Sort by day of the week
            ]);
        } else if (timeframe === 'yearly') {
            salesData = await Order.aggregate([
                { $match: matchCondition },
                { $unwind: "$products" },
                {
                    $group: {
                        _id: { $year: "$orderDate" }, // Group by year
                        totalSales: { $sum: "$products.price" } // Sum of sales
                    }
                },
                { $sort: { _id: 1 } } // Sort by year
            ]);
        }

        // Prepare the response data
        res.json(salesData);
    } catch (error) {
        next(error)
        res.status(500).send("Server Error");
    }
};
