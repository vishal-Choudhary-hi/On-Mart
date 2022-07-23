const mysql = require('mysql');
const jwt=require('jsonwebtoken');
const bcrypt=require('bcryptjs');
const multer=require('multer')
const { promisify }=require('util');
const alert=require('alert');
const path = require('path');
var addedtocart=false;

const db=mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nodejs-login'
});
exports.register = (req,res) => {
    
    const{name , email, phoneNumber, address,password, Confirm_Pass_Word}=req.body;
    db.query('SELECT email FROM users WHERE email= ? ', [email] ,async (error,results) => {
        if(error){
            console.log(error);
        }
        if(results.length>0) {
            return res.render('login.pug',{
                message:'Email already in use'
            })
        }else if(password !==Confirm_Pass_Word){
            return res.render('login.pug',{
                message:'Passwords do not match'
            });
        }

        let hashedPassword = await bcrypt.hash(password,8);
        db.query('INSERT INTO users SET ?',{name: name, email: email,password: hashedPassword,phoneNumber: phoneNumber,address:address},(error,rows,fields)=>{
            if(error)
            {
                console.log(error);
            }
            else{
                return res.render('login.pug',{message:'User Registered'});
            }
        })
    });
}

exports.login = async(req,res)=>{
    try {
        const{email,password} = req.body;

        if( !email || !password){
            return res.status(400).render('logedin.pug',{
                message:'Please provide email/password'
            })
        }

        db.query('SELECT * FROM users WHERE email=?',[email],async(error,results)=>
        {
            if(!results||!(await bcrypt.compare(password,results[0].password)))
            {
                res.status(401).render('logedin.pug',{
                    message:'Email or password is incorrect'
                })
            }
            else{
                const id =results[0].id;
                const cart=results[0].cart;
                let tablename='cart'+results[0].id;
                if(cart==0){
                    db.query('UPDATE users SET cart=1 WHERE id=?',id);
                    db.query('CREATE TABLE '+tablename+' (item_number int ,item_id int ,quantity int)',{tablename})
                }
                const token =jwt.sign({id :id},'mypasword',{
                    expiresIn:'90d'
                });
                const cookieOptions={
                    expires: new Date(Date.now()+90 * 24 *60*60*100),
                    httpOnly: true,
                    // secure: false
                }
                res.cookie('jwt',token,cookieOptions);
                res.status(200).redirect('/');
            }
        })
    } catch (error) {
        console.log(error);
    }
}

exports.isLoggedIn = async(req, res,next)=>{
    if(req.cookies.jwt){
        try{
            const decoded = await promisify(jwt.verify)(req.cookies.jwt ,
                'mypasword')
                db.query('SELECT* FROM users WHERE id=?',[decoded.id],(error,result)=>{
                    if(!result)
                    {
                        return next();
                    }
                    req.user=result[0];
                    return next();
                });
        }
        catch (error){
            console.log(error);
            return next();
        }
    }
    else{
        next();
    }
}
exports.owner = async(req,res)=>{
    const{product_name , product_price, product_quantity,product_stock,product_category}=req.body;
    db.query('SELECT product_name FROM items WHERE product_name= ? ', [product_name] ,async (error,results) => {
        if(results.length>0){
            return res.render('owner.pug',{
            
                message:'Product is already there'
            })
        }
        db.query('INSERT INTO items SET ?',{product_name , product_price, product_quantity,product_stock,product_category},(error,results)=>{
            if(error)
            {
                console.log(error);
            }
            
            else{
                return res.render('owner.pug')
            }

        })
    })
}
exports.edititems = async(req,res)=>{
    const{product_name , product_price, product_quantity,product_stock,product_category}=req.body;
    db.query('SELECT product_name FROM items WHERE product_name= ? ', [product_name] ,async (error,results) => {
        if(results.length==0) {
            return res.render('edititems.pug',{
            
                message:'Product is not there'
            })
        }
        db.query('UPDATE items SET product_price=?, product_quantity=?,product_stock=? ,product_category=? WHERE product_name=?',[product_price,product_quantity,product_stock,product_category,product_name],(error,results)=>{
            if(error)
            {
                console.log(error);
            }
            
            else{
                return res.render('edititems.pug')
            }

        })
    })
}
exports.deleteitems = async(req,res)=>{
    const{product_name}=req.body;
    db.query('SELECT product_name FROM items WHERE product_name= ? ', [product_name] ,async (error,results) => {
        if(results.length==0) {
            return res.render('deleteitems.pug',{
            
                message:'Product is not there'
            })
        }
        db.query('DELETE FROM items WHERE product_name=?',[product_name],(error,results)=>{
            if(error)
            {
                console.log(error);
            }
            
            else{
                return res.render('deleteitems.pug')
            }

        })
    })
}
exports.displayallitems=(req,res,next)=>{
    var products = [];
    db.query('SELECT * FROM items', function(err,rows,fields) {
        let rowlength=rows.length;
        if(err){
            console.log(err);
        } else {
            if(rows.length>9){
                rowlength=9;
            }
            for(var i=0;i<rowlength;i++)
            {
                var product={
                    'product_name':rows[i].product_name,
                    'product_price':rows[i].product_price,
                    'product_quantity':rows[i].product_quantity,
                    'product_id':rows[i].product_id,
                    'stock':rows[i].product_stock
                }
                products.push(product);
            } 
            req.products=products;
            return next();       
        }
    });
}

exports.addtocart= async(req,res,next)=>{
    const {item_id}=req.body;
    if(req.cookies.jwt){
        try{
            const decoded = await promisify(jwt.verify)(req.cookies.jwt ,'mypasword')
                db.query('SELECT * FROM users WHERE id=?',[decoded.id],(error,result)=>{
                    if(!result)
                    {
                        return ;
                    }
                    db.query('SELECT item_id FROM '+'cart'+decoded.id +' WHERE item_id= ?',[item_id], function(err,results) {
                        if(err){
                            console.log(err);
                        }
                        else if(results.length>0){
                            return;
                        } 
                        else {
                            db.query('INSERT INTO '+'cart'+ decoded.id+' SET item_id='+item_id);
                            db.query('UPDATE cart'+ decoded.id+' SET quantity =1 WHERE item_id=?',item_id);
                        }
                    });
                });
        }
        catch (error){
            console.log(error);
        }
    }
    else{
        res.redirect('/login');
    }
}
exports.search=async(req,res)=>{
    const {search}=req.body;
    const sqlsearch="%"+search+"%";
    db.query('SELECT * FROM items WHERE product_name LIKE ?',sqlsearch,function(err,rows,fields){
        var products = [];
        if(err){
            console.log(err);
        } else if(rows.length==0){
            res.render("searchresults.pug",{
                message:"sorry No reults for "+search
            })
            return;
        } else{
            for(var i=0;i<rows.length;i++)
            {
                var product={
                    'product_name':rows[i].product_name,
                    'product_price':rows[i].product_price,
                    'product_quantity':rows[i].product_quantity,
                    'product_id':rows[i].product_id,
                    'stock':rows[i].product_stock
                }
                products.push(product);
            } 
            req.products=products;    
        }
        res.render("searchresults.pug",{
            products:products
        })
    })
}
exports.plustocart=async(req,res,next)=>{
    const {item_id}=req.body;
    var Quantity=0;
    var stock=0;
    if(req.cookies.jwt){
        try{
            const decoded = await promisify(jwt.verify)(req.cookies.jwt ,'mypasword')
                db.query('SELECT * FROM users WHERE id=?',[decoded.id],(error,result)=>{
                    if(!result)
                    {
                        return ;
                    }
                    db.query('SELECT item_id FROM cart'+ decoded.id+' WHERE item_id= ?',[item_id], function(err,results) {
                        if(err){
                            console.log(err);
                        }
                        else{
                            db.query('SELECT quantity FROM cart'+ decoded.id+' WHERE item_id=?',item_id,function(err,rows,fields){
                                if(err){
                                    consol.log(err);
                                }
                                else{
                                    Quantity=rows[0].quantity;
                                }
                                db.query('SELECT product_stock FROM items WHERE product_id=?',item_id,function(err,rows,fields){
                                    if(err){
                                        consol.log(err);
                                    }
                                    else{
                                        stock=rows[0].product_stock;
                                    }
                                    if(Quantity>stock-1){
                                        alert('can not add more items');
                                    }
                                    else{
                                        db.query('UPDATE cart'+ decoded.id+' SET quantity= quantity+1 WHERE item_id=?',item_id);
                                    }
                                    res.status(200).redirect('/mycart');
                                    return next();
                                });
                            });
                        }
                    });
                });
        }
        catch (error){
            console.log(error);
            return next();
        }
    }
    else{
        res.redirect('/login');
    }
    
}
exports.minustocart=async(req,res,next)=>{
    const{item_id}=req.body;
    if(req.cookies.jwt){
        try{
            const decoded = await promisify(jwt.verify)(req.cookies.jwt ,'mypasword')
                db.query('SELECT * FROM users WHERE id=?',[decoded.id],(error,result)=>{
                    if(!result)
                    {
                        return ;
                    }
                    db.query('SELECT quantity FROM cart'+ decoded.id+' WHERE item_id= ?',item_id,function(err,rows,fields){
                        if(err)
                        console.log(err)
                        else{
                                db.query('UPDATE cart'+ decoded.id+' SET quantity=quantity-1 WHERE item_id=?',item_id);
                
                                var product={
                                    'quantity':rows[0].quantity
                                }
                                if(product.quantity<=1){
                                    db.query('DELETE FROM cart'+ decoded.id+' WHERE item_id=?',item_id);
                                    req.allminus='minus';
                                }
                            } 
                            res.status(200).redirect('/mycart');
                            return next();         
                        });
                });
        }
        catch (error){
            console.log(error);
            return next();
        }
    }
    else{
        res.redirect('/login');
    }
    
}
exports.buildcart=async(req,res,next)=>{
    if(req.cookies.jwt){
        try{
            const decoded = await promisify(jwt.verify)(req.cookies.jwt ,'mypasword')
                db.query('SELECT * FROM users WHERE id=?',[decoded.id],(error,result)=>{
                    if(!result)
                    {
                        return ;
                    }
                    db.query('SELECT * FROM items INNER JOIN cart'+ decoded.id+' ON items.Product_id=cart'+ decoded.id+'.item_id',function(err,rows,fields){
                        if(err)
                        console.log(err)
                        else if(rows.length ==0){
                            req.emptycart="hi";
                            return next();
                        }
                        else{
                            var cart_products=[];
                            var totalprice=0;
                            for(var i=0;i<rows.length;i++)
                                {
                                    var product={
                                        'product_name':rows[i].product_name,
                                        'product_price':rows[i].product_price,
                                        'product_quantity':rows[i].product_quantity,
                                        'product_id':rows[i].product_id,
                                        'quantity':rows[i].quantity,
                                        'product_category':rows[i].product_category
                                    }
                                    cart_products.push(product);
                                    totalprice=totalprice+(product.product_price*product.quantity);
                                } 
                    
                                req.cart_products=cart_products;
                                req.totalprice=totalprice;
                                return next();
                            }
                    })

                });
        }
        catch (error){
            console.log(error);
            return next();
        }
    }
    else{
        res.redirect('/login');
    }

}
exports.personalcategory=async(req,res,next)=>{
    let products=[];
    let messages='hi';
    let category_name='Personal'
    db.query('SELECT *from items WHERE product_category=?','personal',function(err,rows){
        if(err){
            console.log(err);
            return next();
        }
        else if(rows.length==0){
            req.message=messages;
            req.name=category_name;
            return next();
        }
        else{
            for(var i=0;i<rows.length;i++)
            {
                var product={
                    'product_name':rows[i].product_name,
                    'product_price':rows[i].product_price,
                    'product_quantity':rows[i].product_quantity,
                    'product_id':rows[i].product_id,
                    'product_category':rows[i].product_category

                }
                products.push(product);
            } 
            req.products=products;
            req.name=category_name;

        }
        return next();
    });
}
exports.snackscategory=async(req,res,next)=>{
    let products=[];
    let messages='hi';
    let category_name='Snacks'
    db.query('SELECT *from items WHERE product_category=?','snacks',function(err,rows){
        if(err)
            console.log(err);
        else if(rows.length==0){
            req.message=messages;
            req.name=category_name;
            return next();
        }
        else{
            for(var i=0;i<rows.length;i++)
            {
                var product={
                    'product_name':rows[i].product_name,
                    'product_price':rows[i].product_price,
                    'product_quantity':rows[i].product_quantity,
                    'product_id':rows[i].product_id,
                    'product_category':rows[i].product_category

                }
                products.push(product);
            } 
            req.products=products;
            req.name=category_name;

        }
        return next();
    });
}
exports.vegeablescategory=async(req,res,next)=>{
    let products=[];
    let messages='hi';
    let category_name='Vegetables';
    db.query('SELECT *from items WHERE product_category=?','vegetables',function(err,rows){
        if(err)
            console.log(err);
        else if(rows.length==0){
            req.message=messages;
            req.name=category_name;
            return next();
        }
        else{
            for(var i=0;i<rows.length;i++)
            {
                var product={
                    'product_name':rows[i].product_name,
                    'product_price':rows[i].product_price,
                    'product_quantity':rows[i].product_quantity,
                    'product_id':rows[i].product_id,
                    'product_category':rows[i].product_category

                }
                products.push(product);
            } 
            req.products=products;
            req.name=category_name;

        }
        return next();
    });
}
exports.fruitscategory=async(req,res,next)=>{
    let products=[];
    let messages='hi';
    let category_name='Fruits'
    db.query('SELECT *from items WHERE product_category=?','fruits',function(err,rows){
        if(err)
            console.log(err);
        else if(rows.length==0){
            req.message=messages;
            req.name=category_name;
            return next();
        }
        else{
            for(var i=0;i<rows.length;i++)
            {
                var product={
                    'product_name':rows[i].product_name,
                    'product_price':rows[i].product_price,
                    'product_quantity':rows[i].product_quantity,
                    'product_id':rows[i].product_id,
                    'product_category':rows[i].product_category

                }
                products.push(product);
            } 
            req.products=products;
            req.name=category_name;

        }
        return next();
    });
}
exports.staplescategory=async(req,res,next)=>{
    let products=[];
    let messages='hi';
    let category_name='Staples';

    db.query('SELECT *from items WHERE product_category=?','staples',function(err,rows){
        if(err)
            console.log(err);
        else if(rows.length==0){
            req.message=messages;
            req.name=category_name;
            return next();
        }
        else{
            for(var i=0;i<rows.length;i++)
            {
                var product={
                    'product_name':rows[i].product_name,
                    'product_price':rows[i].product_price,
                    'product_quantity':rows[i].product_quantity,
                    'product_id':rows[i].product_id,
                    'product_category':rows[i].product_category

                }
                products.push(product);
            } 
            req.products=products;
            req.name=category_name;

        }
        return next();
    });
}

exports.store_image=async(req,res,next)=>{
    res.redirect("/productimage")
}
exports.checkout=async(req,res,next)=>{
    if(req.cookies.jwt){
        try{
            const decoded = await promisify(jwt.verify)(req.cookies.jwt ,'mypasword')
                db.query('SELECT * FROM users WHERE id=?',[decoded.id],(error,result)=>{
                    if(!result)
                    {
                        return ;
                    }
                    db.query('SELECT * FROM items INNER JOIN cart'+ decoded.id+' ON items.Product_id=cart'+ decoded.id+'.item_id',function(err,rows,fields){
                        if(err)
                            console.log(err)
                        else{
                            for(var i=0;i<rows.length;i++)
                            {
                                var product={
                                    'product_stock':rows[i].product_stock,
                                    'product_id':rows[i].product_id,
                                    'quantity':rows[i].quantity
                                }
                                quantity_ordered=product.product_stock-product.quantity;
                                db.query('UPDATE items SET product_stock=? WHERE product_id=?',[quantity_ordered,product.product_id]);
                                db.query('truncate table cart'+ decoded.id+'');
                            }
                        }
                    })
                    res.redirect("/")
                });
        }
        catch (error){
            console.log(error);
            return next();
        }
    }
    else{
        res.redirect('/login');
    }   
}

exports.logout=async(req,res)=>{
    res.cookie('jwt','logout',{
        expires:new Date(Date.now()+2*1000),
        httpOnly:true
    });
    res.status(200).redirect('/');
}
exports.editprofile=async(req,res)=>{
    const{email ,name , phoneNumber, address}=req.body;
    db.query("UPDATE users SET name=? ,phoneNumber=? ,address=? WHERE email= ?",[name,phoneNumber,address,email],function(row,error){
            res.status(200).redirect("/");
    });
}