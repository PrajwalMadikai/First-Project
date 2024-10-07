const multer=require('multer')
const path=require('path')
 

const Filestorage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"public/product_img")
    },
    filename:(req,file,cb)=>{
        console.log(file);
        cb(null,file.fieldname+"-"+Date.now()+path.extname(file.originalname))
        
    }
})
let fileF=(req,file,cb)=>{
            const fileType=/jpeg|jpg|png|gif/
            const extName=fileType.test(path.extname(file.originalname).toLowerCase())
            const mimetype=fileType.test(file.mimetype)
            
            if(mimetype && extName)
            {
                return cb(null,true)
            }else{
                alert("Image only!!")
            }
        } 
 

exports.upload=multer({storage:Filestorage,fileFilter:fileF});