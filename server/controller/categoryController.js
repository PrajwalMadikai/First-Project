const Category=require('../model/categorySchema')

exports.getCategory=async(req,res,next)=>{
   try{
    let category=await Category.find({})
     
    
    res.render('./admin/viewCategory',{category})
    }catch(error){
        next(error)
         
    } 
}
exports.addCategoryGet=async(req,res,next)=>{
    res.render('./admin/addCategory')
} 

exports.addCategory=async(req,res,next)=>{
    try {
         const category= await Category.findOne({name:req.body.name})
         
         
         if(category)
            {
                req.flash('error',"Category Already added!!")
                res.redirect('/admin/category/add')
        }else{
        const newCategory=new Category({
            name:req.body.name,
            isBlock:false
             })
         await  Category.create(newCategory)
          req.flash('success','Category Added Successfully!!')
          res.redirect('/admin/category')

    }
        
    } catch (error) {
        req.flash('error','Couldnt able to add Category ')
        next(error)
        
    }
}
  
exports.geteditCategory=async(req,res,next)=>{
    try{
        const category=await Category.findOne({_id:req.params.id})
        res.render('./admin/editCategory',{category})
    }catch(error)
    {
        next(error)
        
    }
}

exports.editCategory=async(req,res,next)=>{
    try {
         
        await Category.findByIdAndUpdate(req.params.id,
            {
                name:req.body.name,
                isBlock:req.body.block
                
            }
        )
        req.flash('success','Category edited Successfully' )

         res.redirect('/admin/category')
    } catch (error) {
        next(error)
        
    }
}

exports.deleteCategory=async(req,res,next)=>{
    try {
        await Category.deleteOne({_id:req.params.id})
        req.flash('error','Category deleted')
        res.redirect('/admin/category')
    } catch (error) {
        next(error)
        
    }
}

 