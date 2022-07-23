const express = require('express');
const router = express('Router');
const multer=require('multer');
const path=require('path');
const authController=require('../controller/auths.js');
const inputValues=[];

    const storage=multer.diskStorage({
        destination:(req,file,cb)=>{
            cb(null,'images')
        },
        filename:(req,file,cb)=>{
            const{product_name}=req.body;
            let imagename=product_name;
            console.log(file)
            cb(null,imagename+ path.extname(file.originalname))
        }
    })
    const upload=multer({
        storage:storage
    })

router.post('/register',authController.register);
router.post('/login',authController.login);
router.post('/owner',authController.owner);
router.post('/edititems',authController.edititems);
router.post('/deleteitems',authController.deleteitems);
router.post('/addtocart',authController.addtocart);
router.post('/plustocart',authController.plustocart);
router.post('/minustocart',authController.minustocart);
router.post('/store_image',upload.single('image'),authController.store_image);
router.post('/checkout',authController.checkout);
router.get('/logout',authController.logout);
router.post('/search',authController.search);
router.post('/editprofile',authController.editprofile);

module.exports=router;