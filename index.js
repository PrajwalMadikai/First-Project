let express=require('express')
let path=require('path')
let nocache=require('nocache')
let session=require('express-session')
const methodOverride=require('method-override')
const flash=require('connect-flash')
let {v4:uuidv4}=require('uuid')
let connectDB=require("./server/config/createDB")
let passport=require('./server/config/passport')
const adminRoute=require('./server/route/admin')  
const cookieParser = require('cookie-parser');
const { errorHandler}=require('./server/middleware/errorHandler')
const { cartMiddleware, wishlistMiddleware } = require('./server/middleware/countMiddleware'); 
require('dotenv').config()
let app=express()


let port= process.env.PORT || 3000;

connectDB();  

app.set('view engine','ejs');

app.use("/public", express.static(path.join(__dirname, "/public")));

app.set('views', path.join(__dirname, 'views'));
  
app.use(session({
    secret: 'secretkey',
    resave:false, 
    saveUninitialized:false ,
}))  
app.use(flash())
app.use((req,res,next)=>{
    res.locals.message=req.flash()
    next()
})

 
app.use(cartMiddleware);  
app.use(wishlistMiddleware); 
app.use(errorHandler); 

app.use(passport.initialize())
app.use(passport.session())

app.use(nocache())
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(methodOverride('_method'))

app.use(cookieParser()); 



app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // HTTP 1.1.
    res.setHeader('Pragma', 'no-cache'); // HTTP 1.0.
    res.setHeader('Expires', '0'); // Proxies.
    next();
  });
 
app.use('/',require("./server/route/route"))
app.use('/admin',adminRoute)

app.use((req, res, next) => {
    res.status(404).render('./partials/404'); // Render the 404 EJS page
});
 
app.listen(port,()=>{console.log(`http://localhost:${port}`);})  