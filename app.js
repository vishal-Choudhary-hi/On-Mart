const express = require('express');
const mysql =require('mysql');
const dotenv=require('dotenv');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const cookieParser=require('cookie-parser');
const multer = require('multer');


const app = express();

dotenv.config({path:'../static/.env'})

const db=mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: 'root',
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});
const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'product_images')
    },
    filename:(req,file,cb)=>{
        console.log(file);
        cb(null,Date.now()+ path.extname(file.originalname))
    }
})
const upload=multer({
    storage:storage
})

db.connect((error)=>{
    if(error){
        console.log(error)
    }
    else{
        console.log("Hello");
    }
})
const port = 8080;


// express specific stuff
app.use(express.urlencoded())
app.use('/static', express.static('static'))
app.use('/images', express.static('images'))


//PUG specific stuff
app.set('veiw engine', '.pug') //set default template engine as pug
app.set('views', path.join(__dirname, 'views')) //set teh views directory/folder

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extensions: false}));
//Routes
app.use('/',require('./routes/pages.js'));
app.use('/auth',require('./routes/auth.js'));
// start the serverm 
app.listen(port, () => {
    console.log('Worked successfulley');
})