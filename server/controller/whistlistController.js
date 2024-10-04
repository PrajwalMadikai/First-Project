const Whistlist=require('../model/wishlist')
const Product=require('../model/productSchema')
const User=require('../model/userSchema')

exports.loadWhistlist = async (req, res) => {
    try {
        let user = await User.findOne({ email: req.session.userAuth });
 
        let wishlist = await Whistlist.findOne({ userId: user._id }).populate('items.productId');
        let count=await Whistlist.countDocuments()

        if (!wishlist) {
            return res.render('./user/wishlist', { wishlist: [], user }); // Render with an empty wishlist
        }

        res.render('./user/wishlist', { wishlist: wishlist.items, user ,count});
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


 

exports.addWhistlist = async (req, res) => {
    try {
        const { productId } = req.body;
        console.log('Product ID:', productId);

        // Find the user
        let user = await User.findOne({ email: req.session.userAuth });
        // Find the product
        let product = await Product.findById(productId);

        // Check if product exists
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Find the existing wishlist for the user
        let wishlist = await Whistlist.findOne({ userId: user._id });

        // Check if wishlist exists
        if (!wishlist) {
            // Create a new wishlist
            wishlist = new Whistlist({
                userId: user._id,
                items: [{
                    productId: product._id,
                    product_name: product.title,
                    price: product.price,
                }]
            });
            await wishlist.save();
            return res.json({ success: true, message: "Product added to Wishlist", newItem: true });
        }

        // Check if the product is already in the wishlist
        const existingItem = wishlist.items.find(item => item.productId.toString() === product._id.toString());

        if (existingItem) {
            return res.json({ success: true, message: "Product already in the Wishlist", oldItem: true });
        } else {
            // Add the new item to the existing wishlist
            wishlist.items.push({
                productId: product._id,
                product_name: product.title,
                price: product.price,
            });
            await wishlist.save();
            return res.json({ success: true, message: "Product added to Wishlist", newItem: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

exports.deleteWhistlist=async(req,res)=>{
    try {
         const {productId}=req.body
         
         await Whistlist.updateOne(
            { 'items._id': productId }, // Find the wishlist where the item.productId matches
            { $pull: { items: { _id: productId } } } // Remove the item from the items array
          );

         res.json({success:true,message:"deleted"})

    } catch (error) {
        console.log(error);
        
    }
}