exports.addCategoryOffer = async (req, res) => {
  try {
     console.log(req.body)
     const {categoryId, discountPercentage, expirAt} = req.body
     const offerType = 'category'

     const category = await Category.findOne({_id:categoryId})

     const products = await Product.find({category_Id:categoryId})
console.log("here")
     if(!category){
        console.log("here1")
        return res.json({success:false,message:'category not found!'})
     }
     console.log("here3")
     if(category.isDelete){
        console.log("here4")
         return res.json({success:false,message:'sorry, the category is removed by admin!'})
     }
     console.log("here5")
     const currTime = Date.now()
     if(new Date(expirAt) <= currTime){
        console.log("here6")
         return res.json({success:false,message:'sorry,expiry time should be in the future!'})
     }
     console.log("here7")
     console.log(discountPercentage,expirAt)
     category.offer = {discountPercentage, expirAt}
     console.log(category)
     category.save()

     products.forEach(async (product) => {
         product.offer = {offerType, discountPercentage, expirAt}
         await product.save()
     });
     console.log(products)
     return res.json({success:true,message:'category offer added successfully'})

 } catch (error) {
     console.error('something went wrong',error)
 }
}