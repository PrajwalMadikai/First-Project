const User=require('../model/userSchema')
const Address=require('../model/address')
const { json } = require('express')
const Order=require('../model/order')
const Wallet=require('../model/wallet')


exports.getProfile=async(req,res)=>{
    try {
        let user=await User.findOne({email: req.session.userAuth})
        const info = await Address.find({ userId: user._id })
        const wallet=await Wallet.find({userId:user._id})
        let orders=await Order.find({userId:user._id,"products.status":"Returned"})
         
        res.render('./user/profile', { user,info,wallet,orders});
        
    } catch (error) {
        console.log(error);
        
    }
 }
 exports.loadAddress=async(req,res)=>{
    
    try {
        let user=await User.findOne({email: req.session.userAuth})
        res.render("./user/address",{user})
    } catch (error) {
        console.log(error);
        
    }
 }
 exports.postAddress=async(req,res)=>{
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
        console.log(error);
        
    }
 }

 exports.getEditAddress=async(req,res)=>{
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
        console.log(error);
        
    }
 }

 exports.postEditAddress = async (req, res) => {
    try {
        let id = req.params.id;
        // Use findOne instead of find to get a single user object
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
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};


 exports.deleteAddress=async(req,res)=>{
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
        console.log(error);
        
    }
 }

 exports.addAmount=async(req,res)=>{
    try {
        const {amount}=req.body
        
        
    } catch (error) {
        console.log(error);
        
    }
 }