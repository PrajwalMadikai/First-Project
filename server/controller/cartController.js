const Product=require('../model/productSchema')
const Cart=require("../model/addtoCart")
const User=require("../model/userSchema")


exports.addCart = async (req, res) => {
    try {
      const id = req.params.id;
      const quantity = req.body.quantity;
  
      const newProduct = await Product.findOne({ _id: id });
      const newUser = await User.findOne({ email: req.session.userAuth });
      let quantityValue = Number(quantity, 10);
      let cartPrice = quantityValue * newProduct.price;
  
      let cartItem = await Cart.findOne({ user_id: newUser._id });
  
      if (cartItem) {
        const itemIndex = cartItem.items.findIndex(
          (item) => item.product_id.toString() === newProduct._id.toString()
        );
  
        if (itemIndex > -1) {
          cartItem.items[itemIndex].quantity += parseInt(quantity);
          cartItem.items[itemIndex].price += cartPrice;
  
          cartItem.total_price += cartPrice;
        } else {
          cartItem.items.push({
            product_id: newProduct._id,
            stock: newProduct.stock,
            quantity: quantityValue,
            price: cartPrice,
            createdAt: Date.now(),
          });
  
          cartItem.total_price += cartPrice;
        }
      } else {
        cartItem = new Cart({
          user_id: newUser._id,
          items: [
            {
              product_id: newProduct._id,
              stock: newProduct.stock,
              quantity: quantityValue,
              price: cartPrice,
              createdAt: Date.now(),
            },
          ],
          total_price: cartPrice,  
        });
      }
  
      await cartItem.save();
      console.log("Added to Cart!!");
  
      return res.status(200).json({ success: true, message: "Item added to cart" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error adding item to cart" });
    }
  };
  
exports.getCart=async(req,res)=>{
    try {

        let user=await User.findOne({email:req.session.user})
        let cart=await Cart.findOne({user_id:user._id}).populate('items.product_id')
         
         
        res.render('./user/cart',{user,cart})
    } catch (error) {
        console.log(error);
    }
}

exports.updateCart=async(req,res)=>{
    try {
        const productID=req.params.id
        let {price,quantity}=req.body

        let user=await User.findOne({email:req.session.user})
        let cart=await Cart.findOne({user_id:user._id,"items.product_id":productID})
    
        let item = cart.items.find(item => item.product_id.toString() === productID.toString());
        if(item){

          let  dif=price-item.price
           let total=cart.total_price+dif  
           console.log('total is:',total);
           
        
                    await Cart.updateOne(
                        {user_id:user._id,"items.product_id":productID},
                        {$set:{'items.$.quantity':quantity,
                           'items.$.price':price,
                            total_price:total
                           }})
                     
                     return res.status(200).json({ total });
                } else {
                    return res.status(404).json({ message: "Item not found in cart" });
                }
    
    } catch (error) {
      res.status(500).json({message:"An error Occurred"})
    }
}

exports.deleteCart=async(req,res)=>{
    try {
        let id=req.params.id
        let userId=req.session.userId
        let cart = await Cart.findOne({ user_id: userId });
        let item = cart.items.find(item => item.product_id.toString() === id);
        let itemTotalCost = item.price;

        await Cart.findOneAndUpdate( 
            {user_id:userId },
            { $pull: { items: { product_id:id } },
            $inc:{total_price:-itemTotalCost} 
             
        }
        );
         
        await cart.save();
        res.json({success:true,message:"Item removed successfully"})
   
    } catch (error) {
        console.log(error);
        
    }
}