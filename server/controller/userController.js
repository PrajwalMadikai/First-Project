const user=require('../model/userSchema')
const mongoose=require('mongoose')
const bcrypt=require('bcrypt')
const nodemailer=require('nodemailer')
const userOtpVerification=require('../model/otpSchema')
const productSchema=require('../model/productSchema')
const categorySchema=require('../model/categorySchema')
const User=require('../model/userSchema')
const Cart=require('../model/addtoCart')
const Wallet=require('../model/wallet')
const jwt=require('jsonwebtoken')
const crypto = require('crypto');
 


const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: 'prajwalbrocamp@gmail.com',
      pass: 'rhhf gstj hybb lpkl'
    }
  });

exports.signGet=async(req,res)=>{
    res.render('./user/signup')
}

exports.signPost=async(req,res)=>{

  try {
         

        let newUser= new user({
        firstName:req.body.firstName,
        lastName:req.body.lastName,
        phone:req.body.phone,
        email:req.body.email,
        password:req.body.password,
        used_refferal:req.body.refferal,
        isBlock:false,
        isAdmin:false

     })
    newUser.password=await bcrypt.hash(newUser.password,10)

    req.session.user=newUser;
    req.session.userEmail=req.body.email;

    // Generate the referral code
    const namePrefix = req.body.firstName.slice(0, 3).toUpperCase(); // First 3 letters of the first name
    const randomId = crypto.randomBytes(4).toString('hex'); // Generate a random 4-byte hex string
    newUser.refferal_code = `${namePrefix}-${randomId}`; // Combine them to form the referral code
     let walletUser=await user.findOne({refferal_code:req.body.referral})
     if(walletUser)
     {
      await Wallet.findOneAndUpdate({referral_code:req.body.refferal},
        {$inc:{balance:500}}
      )

     }


    const otp=`${Math.floor(1000+Math.random()*9000)}`;

        const mailOptions = {
            from: process.env.EMAIL,
            to:req.session.userEmail,
            subject: 'Welcome to Our Service!',
            text: `Please enter ${otp} for verifying your account`
          };
          console.log(otp);
          console.log("User Email:", req.body.email);
          req.session.otp=otp; 

        const newOtp=new userOtpVerification({
                    otp:otp,
                    email:req.body.email,
                    createdAt:Date.now(),
                    
                  })

       await userOtpVerification.create(newOtp)

    //    await userOtpVerification.updateOne({ email: newUser.email }, { $set: { otp } });

       await transporter.sendMail(mailOptions)
        

       console.log("OTP sented");
       res.redirect('/otp-page')
        
        
    
    } catch (error) {
        console.log(error);
        
    }
}

 


exports.otpPage=async (req,res)=>{
    try {
        res.render('./user/otp') 
        } catch (error) {
        console.log(error);
        }
}

exports.otpPost=async (req,res)=>{
    try {
         let otpFinder=await userOtpVerification.findOne({ email:req.session.userEmail})

         console.log("saved otp:"+otpFinder);
         Number(otpFinder) 
        
         if(otpFinder.otp==req.body.otp)
         {
            await user.create(req.session.user)
            res.render('./user/login')
         }else{ 
            req.flash('error','Otp do not match')
            res.redirect('/otp-page')
         }
        } catch (error) {
        console.log(error);
        
        }
}

exports.forgotGet=async (req,res)=>{
     try {

        res.render('./user/email')
     } catch (error) {
        console.log(error);
        
     }
}
exports.forgotPost=async(req,res)=>{
     
        req.session.userEmail=req.body.email

        try {
            let user=await User.find({email:req.body.email})
            
            if(user){
                const otp=`${Math.floor(1000+Math.random()*9000)}`;

                const mailOptions = {
                    from: process.env.EMAIL,
                    to:req.session.userEmail,
                    subject: 'Email Verification for trendView!',
                    text: `Please enter ${otp} for verifying your account`
                };
                console.log("User Email in forgot pass: ", req.session.userEmail);
                req.session.otp=otp; 
                    const newOtp=new userOtpVerification({
                            otp:otp,
                            email: req.session.userEmail,
                            createdAt:Date.now(),
                            
                        })

                await userOtpVerification.create(newOtp)
                console.log("document saved");
                
                await userOtpVerification.updateOne({email:req.session.userEmail},{$set:{otp:otp}})  // if not work put single otp field

                await transporter.sendMail(mailOptions)
                
                console.log('otp for email verification!!  ',otp);
                
                res.redirect('/emailcode')
                }else{
                    req.flash('error',"Invalid Email ID")
                res.render('./user/email')
                }
        
    } catch (error) {
        console.log(error);
    }
}
exports.emailVerifyGet=async(req,res)=>{
    try {
         
        res.render("./user/emailVerification")
    } catch (error) {
        console.log(error);
        
    }
}
exports.emailVerifyPost=async(req,res)=>{
    try {
        let user=await userOtpVerification.findOne({email:req.session.userEmail})
        console.log('verify User:',user);
        
        if(req.body.otp==user.otp)
        {
            res.redirect('/change-password')
        }else{
            req.flash('error',"Incorrect otp")
            res.redirect('/emailcode')
        }
    } catch (error) {
        console.log(error);
        
    }
}

exports.newPassGet=async(req,res)=>{
   try {
         
        res.render("./user/changePassword")
   } catch (error) {
    console.log(error);
    
   }
}
exports.newPassPatch=async(req,res)=>{
    try {
        let user=await User.find({email:req.session.emailVerification})
        let newPass=req.body.password;
        console.log('new pass:',newPass);
        
        newPass =await bcrypt.hash(req.body.password,10)
        
        user.password=newPass
        req.flash("success","Password Changed successfully !")
        res.redirect('/login')

        
    } catch (error) {
        console.log(error);
        
    }
}

exports.otpResent=async(req,res)=>{
    try {
        let user=await User.findOne({email:req.session.userEmail})
        const otp=`${Math.floor(1000+Math.random()*9000)}`;

        const mailOptions = {
            from: process.env.EMAIL,
            to:req.session.userEmail,
            subject: 'Welcome to Our Service!',
            text: `Please enter ${otp} for verifying your account`
          };
          console.log("resent otp:",otp);
           
          req.session.otp=otp; 
         console.log("resent otp email in forgot:",req.session.userEmail);
         
        const newOtp=new userOtpVerification({
                    otp:otp,
                    email:req.session.userEmail,
                    createdAt:Date.now(),
                    
                  })

       await userOtpVerification.create(newOtp)

       await userOtpVerification.updateOne({ email: req.session.userEmail}, { $set: { otp:otp } });

       await transporter.sendMail(mailOptions)
        

       console.log("OTP Resented");
    } catch (error) {
        console.log(error);
        
    }
}

exports.otpResentPost=async(req,res)=>{
    try {
        let otpFinder=await userOtpVerification.findOne({ email:req.session.userEmail})

        console.log("saved otp:"+otpFinder);
        Number(otpFinder) 
       
        if(otpFinder.otp==req.body.otp)
        {
           await user.create(req.session.user)
           res.render('./user/login')
        }else{ 
           req.flash('error','Otp do not match')
           res.redirect('/otp-page')
        }
        
    } catch (error) {
        console.log(error);
        
    }
}
 
exports.loginGet=async(req,res)=>{
    if(req.session.user)
    {
        res.redirect('/')
    }else{
    res.render('./user/login')
    }
}

exports.loginPost=async(req,res)=>{
    try {
        let findUser = await user.findOne({ email: req.body.email });

        if(!findUser){
            res.render('./user/login',{wrong:"No User or Password Found"})
        }

        req.session.userAuth=findUser.email;
        req.session.isBlock=findUser.isBlock;
        req.session.userInfo=findUser
        req.session.userId=findUser._id

        let wallet=new Wallet({
            userId:findUser._id,
            referral_code:findUser.refferal_code
        })
        await Wallet.create(wallet)
         
        console.log('User Email sign:', req.session.userEmail);
        console.log('Is Block sign:', req.session.isBlock);

        let isMatch=await bcrypt.compare(req.body.password,findUser.password)
        console.log("is match",isMatch);
        
         
        const token=jwt.sign(
            {_id:findUser._id,isBlock:findUser.isBlock},
            process.env.JWT_TOKEN,
            {expiresIn:"2h"}
        )
        res.cookie('token',token,{httpOnly:true})

        if(isMatch && findUser.isAdmin==false && findUser.isBlock==false || req.session.isBlock==false){
            req.session.user=findUser.email
        
            res.redirect('/')
        }else if(findUser.isBlock==true){
             
            req.flash('wrong',"You are Blocked")
            res.redirect('/login')
        }else {
            req.flash('wrong',"Username or password does not match")
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error); 
        
    }
    
}
 
 exports.homeGet=async(req,res)=>{
    try{
       let user=await User.findOne({email:req.session.user})
       let product = await productSchema.find().limit(8);
       
        res.render("./user/home",{user,product})
       
    }catch(error)
    {
        console.log(error);
        
    }
 }

 exports.shirtGet=async(req,res)=>{
    try {
        let user=await User.findOne({email:req.session.user})
        const sort = req.query.sort || '';
        const query = ''; // Ensure query is always defined
        const searchQuery = req.query.query || ''; 
        let sortOption = {};
        if (sort === 'priceLowHigh') {
            sortOption = { price: 1 };
        } else if (sort === 'priceHighLow') {
            sortOption = { price: -1 };
        } else if (sort === 'nameAZ') {
            sortOption = { title: 1 };
        } else if (sort === 'nameZA') {
            sortOption = { title: -1 };
        }
    
        const product = await productSchema.find({category:"Shirt", isBlock: false ,title: { $regex: searchQuery, $options: 'i' } })
            .sort(sortOption);

           res.render('./user/shirt',{product,sort,user,searchQuery })
         
    } catch (error) {
        console.log(error);
        
    }
 }

 exports.viewProduct=async(req,res)=>{
    try {
        let user=await User.findOne({email:req.session.user})
        const id=new mongoose.Types.ObjectId(req.params.id)
        let productData=await productSchema.findOne({_id:id})
        let relatedProduct=await productSchema.find({category:productData.category}).limit(6)
        let cart=await Cart.findOne({user_id:user._id,'items.product_id':id})

        res.render('./user/productView',{productData,relatedProduct,user,cart})
         
        
    } catch (error) {
        console.log(error);
        
    }
 }

 




 exports.logout=async(req,res)=>{
    try {
        req.session.destroy(err => {
            if (err) {
              return res.status(500).send('Failed to destroy session');
            }
        })
        console.log("logout successfully");
        
        res.redirect('/')
    } catch (error) {
        console.log(error);
        
    }
 } 

  