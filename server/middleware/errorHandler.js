const errorHandler=async(err,req,res,next)=>{

    const errorMessage=err.message || "Something Went Wrong !!"
    
    res.status(500).render('error', { errorMessage });
}

module.exports={errorHandler}