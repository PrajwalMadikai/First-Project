const user=require('../model/userSchema')
const product=require('../model/productSchema')
const fileUpload=require('../model/productSchema')
const Category=require('../model/categorySchema')
const Brand=require('../model/brandSchema')


exports.getProduct=async (req,res)=>{
    const currentPage = parseInt(req.query.page) || 1;  
    const itemsPerPage = 6;  
    let totalProducts=await fileUpload.countDocuments()

    let product=await fileUpload.find({}).skip((currentPage - 1) * itemsPerPage).limit(itemsPerPage); 
    const totalPages = Math.ceil(totalProducts / itemsPerPage);  
    res.render('./admin/displayProduct',{products:product,currentPage, totalPages})
}
 
exports.getaddProduct=async (req,res)=>{
        try {
            let category=await Category.find()
            let brands=await Brand.find()
            res.render('./admin/addProduct',{category,brands})
        } catch (error) {
            
        }
}

exports.addProduct=async (req,res)=>{
     
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
    console.log(error);
   }
    
    
}

exports.editProduct=async (req,res)=>{
    try {
        const getProduct=await fileUpload.findOne({_id:req.params.id})
        res.render('./admin/editProduct',{product:getProduct})
    } catch (error) {
        console.log(error);
        
    }

}
exports.editProductPut=async(req,res)=>{
    try {
            const productName=req.body.productName;
           
            const category=req.body.category
            const brand=req.body.brand
            const price=req.body.price
            const stock=req.body.stock
            const files=await req.files;
            const design=req.body.design
            const fit=req.body.fit
            const material=req.body.material
            const occassion=req.body.occassion

        await fileUpload.findByIdAndUpdate(req.params.id,
            {
                title:productName,
                category:category,
                brand:brand,
                price:price,
                stock:stock,
                design:design,
                fit:fit,
                material:material,
                occassion:occassion,
                "image.image1": files.img1[0].filename,
                "image.image2": files.img2[0].filename,
                "image.image3": files.img3[0].filename,
                 
            })
            res.redirect('/admin/product')
        
    } catch (error) {
        console.log(error);
        
    }
}
exports.deleteProduct=async(req,res)=>{
    try {
        await fileUpload.deleteOne({_id:req.params.id})
        res.redirect('/admin/product')
        
    } catch (error) {
        console.log(error);
        
    }
    
}

// exports.filterItem=async(req,res)=>{
    
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
//         console.log(error);
        
//     }
// }