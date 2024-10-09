const User=require('../model/userSchema')
const Address=require('../model/address')
const Order=require('../model/order')
const Wallet=require('../model/wallet')
const crypto = require('crypto');

exports.getProfile=async(req,res,next)=>{
    try {
        let user=await User.findOne({email: req.session.userAuth})
        const info = await Address.find({ userId: user._id })
        const wallet=await Wallet.findOne({userId:user._id})
        if(!wallet)
        {
            let newWallet=new Wallet({
                userId:user._id,
                balance:0,
                 
            })
            await Wallet.create(newWallet)
        }
        if(!user.refferal_code){
            const namePrefix = user.firstName.slice(0, 3).toUpperCase(); // First 3 letters of the first name
            const randomId = crypto.randomBytes(4).toString('hex'); // Generate a random 4-byte hex string
            let ref= `${namePrefix}-${randomId}`; // Combine them to form the referral code
            user.refferal_code=ref
        }
        
         
        res.render('./user/profile', { user,info,wallet});
        
    } catch (error) {
       next(error)
        
    }
 }
 

 exports.editProfile=async(req,res,next)=>{
    try {
        const {firstName,email,phone}=req.body
        let user=await User.findOne({email: req.session.userAuth})
        await User.updateOne(
            { _id:user._id },
            {
                $set: {
                    firstName: firstName,
                    phone: phone
                }
            }
        );
        
        res.redirect('/profile')
        
    } catch (error) {
       next(error)
        
    }
 }
 exports.loadAddress=async(req,res,next)=>{
    
    try {
        let user=await User.findOne({email: req.session.userAuth})
        res.render("./user/address",{user})
    } catch (error) {
       next(error)
        
    }
 }
 exports.postAddress=async(req,res,next)=>{
    try {
        
           let name=req.body.name
           let houseName=req.body.houseName
           let city=req.body.city
           let state=req.body.state
           let district=req.body.district
           let pin=req.body.pinCode
           let phone=req.body.phoneNumber
        
        let user=await User.findOne({email:req.session.userAuth})
        let existingUserAddress=await Address.findOne({userId:user._id})
        
        if(existingUserAddress)
        {
            existingUserAddress.address.push({
                name:name,
                houseName:houseName,
                city:city,
                state:state,
                district:district,
                pin:pin,
                phone:phone

            })
            await existingUserAddress.save()
        }else{
          let newDocument=new Address({
                        userId:user._id,
                        address:[{
                            name:name,
                            houseName:houseName,
                            city:city,
                            state:state,
                            district:district,
                            pin:pin,
                            phone:phone
                        }]
                                    })
          await newDocument.save()
        }
        res.status(200).json({success:true,message:"Address Added"})
        
    } catch (error) {
       next(error)
        
    }
 }

 exports.getEditAddress=async(req,res,next)=>{
    try {
        let id=req.params.id
        let user=await User.findOne({email:req.session.userAuth})
        let addressDocument = await Address.findOne(
            { userId: user._id, "address._id": id },
            { "address.$": 1 } // This will only return the specific address matching the id
        );
        
        let address = addressDocument.address[0]; // Get the first element, which is the specific address object

        
        res.render('./user/editAddress',{address,user})
    } catch (error) {
       next(error)
        
    }
 }

 exports.postEditAddress = async (req, res,next) => {
    try {
        let id = req.params.id;
      
        let user = await User.findOne({ email: req.session.userAuth });
        
        // Ensure the user is found
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Update the address within the user's address array
        await Address.findOneAndUpdate(
            { userId: user._id, 'address._id': id },
            {
                $set: {
                    'address.$.name': req.body.name,
                    'address.$.houseName': req.body.houseName,
                    'address.$.city': req.body.city,
                    'address.$.state': req.body.state,
                    'address.$.district': req.body.district,
                    'address.$.phone': req.body.phone,
                    'address.$.pin': req.body.pinCode
                }
            }
        );
        
        res.redirect('/profile');
    } catch (error) {
       next(error)
        res.status(500).send('Internal Server Error');
    }
};


 exports.deleteAddress=async(req,res,next)=>{
    try {
        let id=req.params.id
        
        let user=await User.findOne({email:req.session.userAuth})
        await Address.findOneAndUpdate(
            { userId: user._id },
            {          
                $pull: {        
                    address: { _id: id }
                }
            }
        );
        
       res.json({success:true,message:"Deleted successfully"})
    } catch (error) {
       next(error)
        
    }
 }

 exports.getContact=async(req,res,next)=>{
    try {
        res.render('./user/contact')
    } catch (error) {
       next(error)
        
    }
 }
 exports.getabout=async(req,res,next)=>{
    try {
        res.render('./user/about')
    } catch (error) {
       next(error)
        
    }
 }


 