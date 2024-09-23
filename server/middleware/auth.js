// const isLogin = async (req, res, next) => {
//     try {
//         const token = req.cookies.token;
//         if (token) {
//             // Verify JWT token
//             const decoded = jwt.verify(token, process.env.JWT_TOKEN);
//             req.user = decoded; // Attach decoded user info to req.user
//             next();
//         } else {
//             res.redirect('/login');
//         }
//     } catch (error) {
//         console.log('Auth Error:', error.message);
//         res.status(500).render('505-error');
//     }
// };

const isLogin = async (req, res, next) => {
   try {
       if (req.session.user) {
           next();
       } else {
           res.redirect('/');
       }
   } catch (error) {
       console.log(error.message);
       res.status(500).render('505-error');
   }
}

const isLogout = async (req, res, next) => {
   try {
       if (req.session.user_id) {
           res.redirect('/home');
       } else {
           next();
       }
   } catch (error) {
       console.log(error.message);
       res.status(500).render('505-error');
   }
}

module.exports = {
   isLogin,
   isLogout
}