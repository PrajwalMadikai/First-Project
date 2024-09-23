const Category=require('../model/categorySchema')

exports.getCategory=async(req,res)=>{
   try{
    let category=await Category.find({})
     
    
    res.render('./admin/viewCategory',{category})
    }catch(error){
        console.log(error);
         
    } 
}
exports.addCategoryGet=async(req,res)=>{
    res.render('./admin/addCategory')
} 

exports.addCategory=async(req,res)=>{
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
        console.log(error);
        
    }
}
  
exports.geteditCategory=async(req,res)=>{
    try{
        const category=await Category.findOne({_id:req.params.id})
        res.render('./admin/editCategory',{category})
    }catch(error)
    {
        console.log(error);
        
    }
}

exports.editCategory=async(req,res)=>{
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
        console.log(error);
        
    }
}

exports.deleteCategory=async(req,res)=>{
    try {
        await Category.deleteOne({_id:req.params.id})
        req.flash('error','Category deleted')
        res.redirect('/admin/category')
    } catch (error) {
        console.log(error);
        
    }
}

 