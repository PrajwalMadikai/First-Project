let auth=function(req,res,next){
    if(req.session.admin)
    {
     next()
    }else{
     res.redirect('/admin/login')
    }
 }
 
 module.exports=auth