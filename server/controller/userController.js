const user = require('../model/userSchema')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const userOtpVerification = require('../model/otpSchema')
const productSchema = require('../model/productSchema')
const categorySchema = require('../model/categorySchema')
const User = require('../model/userSchema')
const Cart = require('../model/addtoCart')
const Wallet = require('../model/wallet')
const Brand = require('../model/brandSchema')
const jwt = require('jsonwebtoken')
const crypto = require('crypto');
const Order = require('../model/order')



const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'prajwalbrocamp@gmail.com',
        pass: 'rhhf gstj hybb lpkl'
    }
});

exports.signGet = async (req, res, next) => {
    res.render('./user/signup')
}

exports.signPost = async (req, res, next) => {

    try {
        const { firstName, lastName, email, phone, password, refferal } = req.body

        let newUser = new user({
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            email: email,
            password: password,
            used_refferal: refferal,
            isBlock: false,
            isAdmin: false

        })
        newUser.password = await bcrypt.hash(newUser.password, 10)

        req.session.user = newUser;
        req.session.userEmail = req.body.email;

        // Generate the referral code
        const namePrefix = firstName.slice(0, 3).toUpperCase(); // First 3 letters of the first name
        const randomId = crypto.randomBytes(4).toString('hex'); // Generate a random 4-byte hex string
        let ref = `${namePrefix}-${randomId}`; // Combine them to form the referral code
        newUser.refferal_code = ref

        console.log('refferal:', newUser.refferal_code);

        let walletUser = await Wallet.findOne({ referral_code: refferal })

        if (walletUser) {

            let newWallet = await Wallet.findOneAndUpdate(
                { referral_code: refferal },
                {
                    $inc: { balance: 500 },
                    $push: {
                        wallet_history: {
                            amount: 500,
                            date: new Date(),
                            transactionType: 'Refferal Reward'
                        }
                    }
                }
            );

        }

        let wallet = new Wallet({
            userId: newUser._id,
            referral_code: ref
        })
        await Wallet.create(wallet)

        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

        const mailOptions = {
            from: process.env.EMAIL,
            to: req.session.userEmail,
            subject: 'Welcome to Our Service!',
            text: `Please enter ${otp} for verifying your account`
        };
        console.log(otp);
        console.log("User Email:", req.body.email);
        req.session.otp = otp;

        const newOtp = new userOtpVerification({
            otp: otp,
            email: req.body.email,
            createdAt: Date.now(),

        })

        await userOtpVerification.create(newOtp)

        await userOtpVerification.updateOne({ email: newUser.email }, { $set: { otp } });

        await transporter.sendMail(mailOptions)


        console.log("OTP sented");

        res.redirect('/otp-page')

    } catch (error) {
        next(error)

    }
}




exports.otpPage = async (req, res, next) => {
    try {
        res.render('./user/otp')
    } catch (error) {
        next(error)
    }
}

exports.otpPost = async (req, res, next) => {
    try {
        let otpFinder = await userOtpVerification.findOne({ email: req.session.userEmail })

        console.log("saved otp:" + otpFinder);
        Number(otpFinder)

        if (otpFinder.otp == req.body.otp) {
            await user.create(req.session.user)
            res.render('./user/login')
        } else {
            req.flash('error', 'Otp do not match')
            res.redirect('/otp-page')
        }
    } catch (error) {
        next(error)

    }
}

exports.forgotGet = async (req, res, next) => {
    try {

        res.render('./user/email')
    } catch (error) {
        next(error)

    }
}
exports.forgotPost = async (req, res, next) => {

    req.session.userEmail = req.body.email

    try {
        let user = await User.find({ email: req.body.email })

        if (user) {
            const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

            const mailOptions = {
                from: process.env.EMAIL,
                to: req.session.userEmail,
                subject: 'Email Verification for trendView!',
                text: `Please enter ${otp} for verifying your account`
            };
            console.log("User Email in forgot pass: ", req.session.userEmail);
            req.session.otp = otp;
            const newOtp = new userOtpVerification({
                otp: otp,
                email: req.session.userEmail,
                createdAt: Date.now(),

            })

            await userOtpVerification.create(newOtp)
            console.log("document saved");

            await userOtpVerification.updateOne({ email: req.session.userEmail }, { $set: { otp: otp } })  // if not work put single otp field

            await transporter.sendMail(mailOptions)

            console.log('otp for email verification!!  ', otp);

            res.redirect('/emailcode')
        } else {
            req.flash('error', "Invalid Email ID")
            res.render('./user/email')
        }

    } catch (error) {
        next(error)
    }
}
exports.emailVerifyGet = async (req, res, next) => {
    try {

        res.render("./user/emailVerification")
    } catch (error) {
        next(error)

    }
}
exports.emailVerifyPost = async (req, res, next) => {
    try {
        let user = await userOtpVerification.findOne({ email: req.session.userEmail })
        console.log('verify User:', user);

        if (req.body.otp == user.otp) {
            res.redirect('/change-password')
        } else {
            req.flash('error', "Incorrect otp")
            res.redirect('/emailcode')
        }
    } catch (error) {
        next(error)

    }
}

exports.newPassGet = async (req, res, next) => {
    try {

        res.render("./user/changePassword")
    } catch (error) {
        next(error)

    }
}
exports.newPassPatch = async (req, res, next) => {
    try {
        let user = await User.find({ email: req.session.emailVerification })
        let newPass = req.body.password;
        console.log('new pass:', newPass);

        newPass = await bcrypt.hash(req.body.password, 10)

        user.password = newPass
        req.flash("success", "Password Changed successfully !")
        res.redirect('/login')


    } catch (error) {
        next(error)

    }
}

exports.otpResent = async (req, res, next) => {
    try {
        let user = await User.findOne({ email: req.session.userEmail })
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

        const mailOptions = {
            from: process.env.EMAIL,
            to: req.session.userEmail,
            subject: 'Welcome to Our Service!',
            text: `Please enter ${otp} for verifying your account`
        };
        console.log("resent otp:", otp);

        req.session.otp = otp;
        console.log("resent otp email in forgot:", req.session.userEmail);

        const newOtp = new userOtpVerification({
            otp: otp,
            email: req.session.userEmail,
            createdAt: Date.now(),

        })

        await userOtpVerification.create(newOtp)

        await userOtpVerification.updateOne({ email: req.session.userEmail }, { $set: { otp: otp } });

        await transporter.sendMail(mailOptions)


        console.log("OTP Resented");
    } catch (error) {
        next(error)

    }
}

exports.otpResentPost = async (req, res, next) => {
    try {
        let otpFinder = await userOtpVerification.findOne({ email: req.session.userEmail })

        console.log("saved otp:" + otpFinder);
        Number(otpFinder)

        if (otpFinder.otp == req.body.otp) {
            await user.create(req.session.user)
            res.render('./user/login')
        } else {
            req.flash('error', 'Otp do not match')
            res.redirect('/otp-page')
        }

    } catch (error) {
        next(error)

    }
}

exports.loginGet = async (req, res, next) => {
    if (req.session.user) {
        res.redirect('/')
    } else {
        res.render('./user/login')
    }
}

exports.loginPost = async (req, res, next) => {
    try {
        let findUser = await user.findOne({ email: req.body.email });

        if (!findUser) {
            res.render('./user/login', { wrong: "No User or Password Found" })
        }

        req.session.userAuth = findUser.email;
        req.session.isBlock = findUser.isBlock;
        req.session.userInfo = findUser
        req.session.userId = findUser._id



        console.log('User Email sign:', req.session.userEmail);
        console.log('Is Block sign:', req.session.isBlock);

        let isMatch = await bcrypt.compare(req.body.password, findUser.password)
        console.log("is match", isMatch);

        const token = jwt.sign(
            { _id: findUser._id, isBlock: findUser.isBlock },
            process.env.JWT_TOKEN,
            { expiresIn: "2h" }
        )
        res.cookie('token', token, { httpOnly: true })

        if (isMatch && findUser.isAdmin == false && findUser.isBlock == false && req.session.isBlock == false) {
            req.session.user = findUser.email

            res.redirect('/')
        } else if (findUser.isBlock == true) {

            req.flash('wrong', "You are Blocked")
            res.redirect('/login')
        } else {
            req.flash('wrong', "Username or password does not match")
            res.redirect('/login')
        }
    } catch (error) {
        next(error)

    }

}

exports.homeGet = async (req, res, next) => {
    try {
        let user = await User.findOne({ email: req.session.user })
        let product = await productSchema.find().limit(8);
        let latestProducts = await productSchema.find().sort({ createdAt: -1 }).limit(4);


        res.render("./user/home", { user, product, latestProducts })

    } catch (error) {
        next(error)

    }
}


exports.shirtGet = async (req, res) => {
    try {
        let user = await User.findOne({ email: req.session.user });
        let category = await categorySchema.find({});
        let brands = await Brand.find({});

        // Get sorting, search, category, brand, and price range parameters from the query
        const sort = req.query.sort || '';
        const searchQuery = req.query.query || '';
        const categories = req.query.categories ? req.query.categories.split(',') : [];
        const brandz = req.query.brands ? req.query.brands.split(',') : [];
        const priceRanges = req.query.priceRanges ? req.query.priceRanges.split(',') : []; // New

        // Sorting options based on query parameter
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

        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const skip = (page - 1) * limit;

        // Filter conditions for categories, brands, search, and price ranges
        let filterConditions = {
            isBlock: false
        };

        // Apply search filter if searchQuery is not empty
        if (searchQuery) {
            filterConditions.title = { $regex: searchQuery, $options: 'i' };
        }

        // Apply categories filter if categories are selected
        if (categories.length > 0) {
            filterConditions.category = { $in: categories };
        }

        // Apply brands filter if brands are selected
        if (brandz.length > 0) {
            filterConditions.brand = { $in: brandz };
        }

        // Apply price range filter
        if (priceRanges.length > 0) {
            const priceConditions = priceRanges.map(range => {
                if (range === '5000+') {
                    return { price: { $gte: 5000 } };
                } else {
                    const [min, max] = range.split('-').map(Number);
                    return { price: { $gte: min, $lt: max } };
                }
            });
            filterConditions.$or = priceConditions;
        }

        const totalProducts = await productSchema.countDocuments(filterConditions);


        const productAggregatePipeline = [
            { $match: filterConditions }, // Match the filtered products
            { $skip: skip }, // Pagination skip
            { $limit: limit }, // Pagination limit
            {
                $addFields: {
                    averageRating: {
                        $avg: "$ratings.rating" // Calculate the average of the ratings
                    }
                }
            }
        ];

        // Add the $sort stage only if sortOption is not empty
        if (Object.keys(sortOption).length > 0) {
            productAggregatePipeline.push({ $sort: sortOption });
        }

        const product = await productSchema.aggregate(productAggregatePipeline);


        const totalPages = Math.ceil(totalProducts / limit);

        res.render('./user/shirt', {
            product,
            sort,
            user,
            searchQuery,
            category,
            brands,
            selectedCategories: categories,
            selectedBrands: brandz,
            selectedPriceRanges: priceRanges, // For keeping track of selected price ranges
            currentPage: page,
            totalPages
        });

    } catch (error) {
        next(error)
        res.status(500).send('Server error');
    }
};




exports.filterProduct = async (req, res, next) => {
    try {
        const selectedCategories = req.query.categories ? req.query.categories.split(',') : [];
        const selectedBrands = req.query.brands ? req.query.brands.split(',') : [];
        const priceRange = req.query.priceRange || '';

        let query = { isBlock: false };

        // Apply category filter if any are selected
        if (selectedCategories.length > 0) {
            query.category = { $in: selectedCategories };
        }

        // Apply brand filter if any are selected
        if (selectedBrands.length > 0) {
            query.brand = { $in: selectedBrands };
        }

        // Apply price range filter
        if (priceRange) {
            query.price = { $lte: priceRange };
        }

        const products = await productSchema.find(query);

        res.json({ products });
    } catch (error) {
        next(error)
        res.status(500).json({ message: 'Internal server error' });
    }
}

exports.viewProduct = async (req, res, next) => {
    try {
        let user = await User.findOne({ email: req.session.user })
        const id = new mongoose.Types.ObjectId(req.params.id)
        let productData = await productSchema.findOne({ _id: id })
        let relatedProduct = await productSchema.find({ category: productData.category }).limit(6)

        res.render('./user/productView', { productData, relatedProduct, user })


    } catch (error) {
        next(error)

    }
}






exports.logout = async (req, res, next) => {
    try {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).send('Failed to destroy session');
            }
        })
        console.log("logout successfully");

        res.redirect('/')
    } catch (error) {
        next(error)

    }
}

