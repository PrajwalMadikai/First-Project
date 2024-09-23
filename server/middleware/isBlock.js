 let User=require('../model/userSchema')
 const jwt = require('jsonwebtoken');
 
async function isValid(req,res,next){
    try {
        // let user=await User.findOne({email:req.session.userAuth})
        // if(req.user||user.isBlock==false)
        //     {
        //         next()
        //     }else{
        //         res.render('./user/login')
        //     }  
         
        const token=req.cookies.token

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }
        const verify=jwt.verify(token,process.env.JWT_TOKEN)
        if(verify.isBlock)
        {
            res.redirect('/login')
        }
        next()
        req.user=verify
    } catch (error) {
        console.log(error);
        
    }
}

module.exports=isValid