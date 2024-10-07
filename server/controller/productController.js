const user=require('../model/userSchema')
const product=require('../model/productSchema')
const fileUpload=require('../model/productSchema')
const Category=require('../model/categorySchema')
const Brand=require('../model/brandSchema')


exports.getProduct=async (req,res,next)=>{
    try{
    const currentPage = parseInt(req.query.page) || 1;  
    const itemsPerPage = 6;  
    let totalProducts=await fileUpload.countDocuments()

    let product=await fileUpload.find({}).skip((currentPage - 1) * itemsPerPage).limit(itemsPerPage); 
    const totalPages = Math.ceil(totalProducts / itemsPerPage);  
    res.render('./admin/displayProduct',{products:product,currentPage, totalPages})
    }catch(error)
    {
        next(error)
    }
}
 
exports.getaddProduct=async (req,res,next)=>{
        try {
            let category=await Category.find()
            let brands=await Brand.find()
            res.render('./admin/addProduct',{category,brands})
        } catch (error) {
            next(error)
        }
}

exports.addProduct=async (req,res,next)=>{
     
   const productName=req.body.productName;
   const category=req.body.category
   const brand=req.body.brand
   const price=req.body.price
   const stock=req.body.stock
   const files=await req.files;
   const oldPrice=req.body.oldPrice

   const design=req.body.design
   const fit=req.body.fit
   const material=req.body.material
   const occassion=req.body.occassion
   

   try {
    
    
    const product=new fileUpload({
        title:productName,
        category:category,
        brand:brand,
        price:price,
        oldPrice:oldPrice,
        isBlock:false,
        stock:stock,
        design:design,
        fit:fit,
        material:material,
        occassion:occassion, 
        "image.image1": files.img1[0].filename ,
        "image.image2": files.img2[0].filename ,
        "image.image3": files.img3[0].filename  
        
    })
     
    
    await product.save();
 
    req.flash('success','Product Added Successfully')
    res.redirect('/admin/product')
    
    
   } catch (error) {
    req.flash('error',' Unable to upload product')
    next(error)
   }
    
    
}

exports.editProduct=async (req,res,next)=>{
    try {
        const getProduct=await fileUpload.findOne({_id:req.params.id})
        res.render('./admin/editProduct',{product:getProduct})
    } catch (error) {
        next(error)
        
    }

}
exports.editProductPut = async (req, res) => {
    const productId = req.params.id;
    const files = req.files;
  
    try {
      // Prepare the updated data
      const updatedData = {
        title: req.body.productName,
        category: req.body.category,
        brand: req.body.brand,
        price: req.body.price,
        oldPrice: req.body.oldPrice,
        stock: req.body.stock,
        design: req.body.design,
        fit: req.body.fit,
        material: req.body.material,
        occassion: req.body.occassion,
        // Handle image updates
        "image.image1": files.img1 ? files.img1[0].filename : req.body.existingImg1,
        "image.image2": files.img2 ? files.img2[0].filename : req.body.existingImg2,
        "image.image3": files.img3 ? files.img3[0].filename : req.body.existingImg3,
      };
  
      // Update the product by its ID
      await fileUpload.findByIdAndUpdate(productId, updatedData);
  
      req.flash('success', 'Product updated successfully');
      res.redirect('/admin/product');
  
    } catch (error) {
      req.flash('error', 'Unable to update product');
      next(error)
    }
  };
  
  
  
exports.deleteProduct=async(req,res,next)=>{
    try {
        await fileUpload.deleteOne({_id:req.params.id})
        res.redirect('/admin/product')
        
    } catch (error) {
        next(error)
        
    }
    
}

// exports.filterItem=async(req,res,next)=>{
    
//     try {
//         const sort = req.query.sort || '';
//         const query = ''; // Ensure query is always defined
//         let sortOption = {};
//         if (sort === 'priceLowHigh') {
//             sortOption = { 'element.price': 1 };
//         } else if (sort === 'priceHighLow') {
//             sortOption = { 'element.price': -1 };
//         } else if (sort === 'nameAZ') {
//             sortOption = { product_name: 1 };
//         } else if (sort === 'nameZA') {
//             sortOption = { product_name: -1 };
//         }
    
//         const product = await fileUpload.find({ isBlock: false })
//             .sort(sortOption);

//            res.render('./user/shirt',{product,sort})
//     } catch (error) {
//         next(error)
        
//     }
// }