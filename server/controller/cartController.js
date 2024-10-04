const Product=require('../model/productSchema')
const Cart=require("../model/addtoCart")
const User=require("../model/userSchema")
const Coupon=require('../model/coupon')
const { default: mongoose } = require('mongoose');
const Wishlist = require('../model/wishlist');


exports.addCart = async (req, res) => {
  try {
      const id =new  mongoose.Types.ObjectId(req.params.id); 
      const quantity = req.body.quantity; 
    
      // Fetch the product and user details
      const newProduct = await Product.findOne({ _id: id });
      const newUser = await User.findOne({ email: req.session.userAuth });
      let quantityValue = Number(quantity, 10);
      let cartPrice = quantityValue * newProduct.price;

      // Find the user's cart
      let cartItem = await Cart.findOne({ user_id: newUser._id });
      
      if(newProduct.stock==0)
      {
       return res.status(200).json({message:"out of stock",stock:true})
      }
      // Handle cart logic
      if (cartItem) {
          const itemIndex = cartItem.items.findIndex(
              (item) => item.product_id.toString() === newProduct._id.toString()
          );

          if (itemIndex > -1) {
              // Item already in cart, update quantity and price
              cartItem.items[itemIndex].quantity += parseInt(quantity);
              cartItem.items[itemIndex].price += cartPrice;
              cartItem.total_price += cartPrice;
          } else {
              // New item, push it to the cart
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
          // No cart exists, create a new one
          cartItem = new Cart({
              user_id: newUser._id,
              items: [{
                  product_id: newProduct._id,
                  stock: newProduct.stock,
                  quantity: quantityValue,
                  price: cartPrice,
                
                  createdAt: Date.now(),
              }],
              total_price: cartPrice,
          });
      }

      await cartItem.save();
     
      let wishlist=await Wishlist.findOne({userId:newUser._id,'items.productId':id})
      if(wishlist){
      await Wishlist.updateOne(
        { userId: newUser._id },  
        { $pull: { items: { productId: newProduct._id } } }   
    );
      }
      

      return res.status(200).json({ success: true, message: "Item added to cart" });
  } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error adding item to cart" });
  }
};

 

exports.getCart = async (req, res) => {
    try {
        let user = await User.findOne({ email: req.session.user });
        let cart = await Cart.findOne({ user_id: user._id }).populate('items.product_id');

        if (!cart) {
            let newCart = new Cart({
                user_id: user._id,
            });
            await Cart.create(newCart);
            cart = newCart;  // Set cart to the newly created cart
        }

        if (cart.items.length === 0) {
            cart.total_price = 0;
        }

        let subtotal = 0;
        let totalCartPrice = 0; // Initialize totalCartPrice

        // Calculate subtotal (sum of product price * quantity for each item)
        if (cart && cart.items.length > 0) {
            cart.items.forEach(item => {
                const itemPrice = item.product_id.price;
                subtotal += itemPrice * item.quantity;
            });
        }

        totalCartPrice = subtotal;

        // Check if any coupon is applied from session
        let appliedCoupon = null;
        let discountAmount = 0;

        // Apply coupon if it exists
        if (req.session.coupon) {
            appliedCoupon = await Coupon.findOne({ coupon_code: req.session.coupon });

            if (appliedCoupon && totalCartPrice >= appliedCoupon.minimum_purchase_amount) {
                discountAmount = (totalCartPrice * appliedCoupon.discount) / 100;
                if (appliedCoupon.maximum_coupon_amount) {
                    discountAmount = Math.min(discountAmount, appliedCoupon.maximum_coupon_amount);
                }
                // Reduce the totalCartPrice by the discount amount
                totalCartPrice -= discountAmount;
            } else {
                req.session.coupon = null; // Clear invalid coupon
            }
        }
        if(totalCartPrice<=5000)
            {
                cart.delivery_charge=50
            }else{
                cart.delivery_charge=90
            }
            subtotal+=cart.delivery_charge

        cart.total_price = subtotal;  
        await cart.save()
         
        res.render('./user/cart', {
            user,
            cart,
            totalCartPrice,
            subtotal,
            appliedCoupon,
            discountAmount: discountAmount.toFixed(2) // Ensure 2 decimal places for discount amount
        });
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).send("An error occurred while retrieving the cart.");
    }
};



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