const express = require('express');
const router = express('Router');
const authController=require('../Controller/auths.js');
router.get('/', authController.isLoggedIn, authController.displayallitems, (req, res) => {
    if(req.user)
    {
        res.status(200).render('home.pug',{
            user:req.user,
            products:req.products,
            addedtocart:req.addedtocart
        });
    }
    else{
        res.status(200).render('home.pug',{
            products:req.products, 
            addedtocart:req.addedtocart  
        })
    }
});

router.get('/login', (req, res) => {
    res.status(200).render('login.pug')
});
router.get('/logedin', (req, res) => {
    res.status(200).render('logedin.pug')
});

router.get('/profile', authController.isLoggedIn, (req, res) => {    
    if(req.user)
    {
        res.status(200).render('profile.pug',{
            user:req.user
        })
    }
    else{
        res.status(200).redirect('/logedin')
    }
});
router.get('/mycart', authController.isLoggedIn,authController.buildcart, (req, res) => {    
    if(req.user)
    {
        res.status(200).render('cart.pug',{
            user:req.user,
            cart:req.emptycart,
            cart_products:req.cart_products,
            totalprice:req.totalprice
        });
    }
    else{
        res.status(401).render('logedin.pug',{
            message:'Make sure to login'
        })
    }
});
router.get('/owner', (req, res) => {

        res.status(200).render('owner.pug');
});
router.get('/edititems',(req,res)=>{
    res.status(200).render('edititems.pug');
});
router.get('/deleteitems',(req,res)=>{
    res.status(200).render('deleteitems.pug');
});
router.get('/productimage',(req,res)=>{
    res.status(200).render('productimage.pug');
});
router.get('/personalcategory',authController.personalcategory,(req, res) => {
    res.status(200).render('categories.pug',{
        message:req.message,
        products:req.products,
        name:req.name
    });
});
router.get('/fruitscategory',authController.fruitscategory,(req, res) => {
    res.status(200).render('categories.pug',{
        message:req.message,
        products:req.products,
        name:req.name
    });
});
router.get('/vegeablescategory',authController.vegeablescategory,(req, res) => {
    res.status(200).render('categories.pug',{
        message:req.message,
        products:req.products,
        name:req.name
    });
});
router.get('/snackscategory',authController.snackscategory,(req, res) => {
    res.status(200).render('categories.pug',{
        message:req.message,
        products:req.products,
        name:req.name
    });
})
router.get('/staplescategory',authController.staplescategory,(req, res) => {
    res.status(200).render('categories.pug',{
        message:req.message,
        products:req.products,
        name:req.name
    });
});
router.get('/editprofile',authController.isLoggedIn,(req,res)=>{
    if(req.user){
    res.status(200).render("editprofile.pug",{
        user:req.user
    })
    }
    else{
        res.status(200).redirect('/logedin')
    }
})
module.exports=router;