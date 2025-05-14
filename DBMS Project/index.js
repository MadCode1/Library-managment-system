import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import bcrypt, { hash } from "bcrypt";
import session from "express-session";
import passport from "passport"
import { Strategy } from "passport-local";
import env from "dotenv"
import mysql from "mysql2";


const db = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"password",
    database:"librarymanagement"
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to the database');
});
const app = express();
const port = 3000;
const saltRounds = 10;

env.config();

const email = process.env.EMAIL;
const empassword = process.env.EPASSWORD;
var otp = "";
const API_URL = "http://localhost:4000";

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));


app.use(
    session({
        secret:process.env.SECRETE,
        resave:false,
        saveUninitialized:true,
        cookie:{
            maxAge: 1000 * 60 * 60 * 1,
        },
    })
)

app.use(passport.initialize());
app.use(passport.session());


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email,
      pass: empassword, // Use App Password, not Gmail password
    },
  });

app.get("/",async (req,res)=>{
    res.render("index.ejs");
});

// 




// 


app.get("/about",(req,res)=>{
    res.render("about.ejs");
});
app.get("/members",(req,res)=>{
    res.render("members.ejs");
});
app.get("/bookI",(req,res)=>{
    res.render("inventory.ejs");
});
app.get("/issue",(req,res)=>{
    res.render("issue-return.ejs");
});
app.get("/manag",(req,res)=>{
    res.render("member-tracking.ejs");
});

app.get("/dashboard", async (req,res)=>{
    try{
        const result = await axios.post(API_URL+"/admin/dashboard");
        // res.render()

        const stats = result.data.stats;
        res.render("admin_dashboard.ejs", { stats });
    }
    catch(err){
        console.log(err);
    }
});

app.get("/books",async (req,res)=>{

    const result = await axios.get(API_URL+"/get/book");
    console.log(result.data);
    // const books = JSON.stringify(result.data);
    const books = result.data;
    res.render("sample.ejs",{books:books});
});

app.post("/get/books",(req,res)=>{
        console.log(req.body);
});

// Admin 

app.get("/manag/books",async(req,res)=>{
    
    const result = await axios.get(API_URL+"/get/book");
    console.log(result.data);
    // const books = JSON.stringify(result.data);
    const books = result.data;
    res.render("books.ejs",{books:books});

});


// 

app.get('/borrows', async (req, res) => {
  const search = req.query.search || '';
  const status = req.query.status || '';

  let sql = `SELECT * FROM borrow WHERE 1=1`;
  const params = [];

  if (search) {
    sql += ` AND (user_id LIKE ? OR book_id LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (status) {
    sql += ` AND status = ?`;
    params.push(status);
  }

  // Example: using db.query with async/await
  try {
    const [borrows] = await db.query(sql, params); // or use db.execute
    res.render('issue-return', {
      borrows,
      search,
      status
    });
  } catch (err) {
    res.status(500).send('Database error: ' + err.message);
  }
});


// 

// 


app.get("/login",(req,res)=>{
    // res.render('login.ejs');
    res.redirect("/admin");
});

app.post("/sendcode",async (req,res)=>{

    // OTP generator

    function generateOTP(length = 6) {
        const digits = '0123456789';
        let otp = '';
        for (let i = 0; i < length; i++) {
          otp += digits[Math.floor(Math.random() * 10)];
        }
        return otp;
      }
      
      // Generate a 6-digit OTP
       otp = generateOTP(4);

    // res.render("register.ejs");
    console.log(req.body.email);
    console.log(req.method);
    console.log(req.url);
    // res.send("succes");
    
    // res.redirect("login");
    // Email options

    

    const mailOptions = {
    from: email,
    to:req.body.email,
    subject:`Whats up mad bro 👻" <${email}>` ,
    text: `check out your OTP\n${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.send('Email sent successfully!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to send email');
  }
});



app.post("/login",async(req,res)=>{
    // console.log(otp);
    // console.log(typeof otp);
    // console.log(typeof (req.body.OTP));

   

    var userOTP = parseInt(req.body.OTP);
 
    console.log(req.body);
    console.log(typeof userOTP);
    console.log(otp);

    if(userOTP == otp){
        console.log("log in success");
    }
    else{
        console.log("nope");
    }


});


app.get("/register", (req,res)=>{
    res.render("register.ejs");
});

app.post("/register",(req,res)=>{
    // res.render("register.ejs");
    console.log(req.body);
    console.log(req.method);
    console.log(req.url);
    // res.redirect("login");
    if(req.body.type == "user"){
        res.render("userReg.ejs");
    }
    else if(req.body.type == "admin"){
        
        res.render("adminReg.ejs");

    }
});

app.post("/admin/register",async(req,res)=>{
    const name =  req.body.name;
    const email =  req.body.email;
    const password = req.body.password;
    
    bcrypt.hash(password, saltRounds, async (err,hash) => {
        if(err){
            console.log("Error hashing password:",err);
        }
        else{
        try{
            const result = await axios.post(API_URL+"/admin/register",{
            name:name,
            email:email,
            password:hash
            });
            console.log(result.data);
            
            res.redirect("/login");
        }
        catch(err){
            res.send(err);
        }
    }

    })

    
});

app.post("/user/register",async(req,res)=>{
    try{
        const result = await axios.post(API_URL+"/user/register",{
        name:req.body.name,
        email:req.body.email,
        phone:req.body.phone,
        address:req.body.address
        });
        console.log(result.data);
        res.redirect("/login");
    }
    catch(err){
        res.send(err);
    }
});

app.get("/admin",(req,res)=>{
   res.render("adminLogin.ejs");
});



// app.post("/admin/login",async(req,res)=>{
// app.get("/admin/dashboard",async(req,res)=>{
    
//     console.log(req.body);
    
//     if(req.isAuthenticated()){
//         res.render("adminpro.ejs", { admin });
//     }
//     else{
//         res.redirect("/admin");

//     // const email    = req.body.email;
//     // const password = req.body.password;


//     // console.log( email);
//     // console.log(password);  
// }
// });

app.get("/admin/dashboard", (req, res) => {
    console.log(req.user);
    if (req.isAuthenticated()) {
        res.render("adminpro.ejs", { admin: req.user });
    } else {
        res.redirect("/admin");
    }
});


app.get('/manag/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) throw err;
    res.render('users', { users: results });
  });
});

app.get('/user/edit/:id', (req, res) => {
  const { id } = req.params;
  // Fetch and render edit form
});

app.get('/user/delete/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM users WHERE user_id = ?', [id], (err) => {
    if (err) throw err;
    res.redirect('/users');
  });
});



app.get('/borrow-records', (req, res) => {
    const query = 'SELECT * FROM borrow';
    
    db.query(query, (err, results) => {
        if (err) throw err;
        
        // Pass the results to the EJS file
        res.render('borrow-table.ejs', { borrowRecords: results });
    });
});


// app.post("/admin/login",(req,res)=>{
//     passport.Authenticator("local",{
//         successRedirect: "/admin/dashboard",
//         failureRedirect: "/",
//     });
// });

// chatgpt
app.post("/admin/login", passport.authenticate("local", {
    successRedirect: "/admin/dashboard",
    failureRedirect: "/admin",
}));

app.get("/logout", (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect("/login"); // Redirect to login or homepage after logout
    });
});


app.post('/chatbot', async (req, res) => {
  const userQuery = req.body.message;

  try {
    const apiRes = await axios.post('http://127.0.0.1:5000/api/ask', {
        message: userQuery
    });
    // console.log(apiRes);

    const botAnswer = apiRes.data.response; // assuming response is { answer: "..." }
    res.render('index', { result: botAnswer });

  } catch (err) {
    console.error('Chatbot API error:', err.message);
    res.render('index', { result: 'Bot is currently unavailable.' });
  }
});
// passport.use(new Strategy(async function verify(email,password,cb){



//     try{


//         const result = await axios.post(`${API_URL}/admin/login`, {
//             email: email,
//             password: password
//         }, {
//             headers: {
//                 "Content-Type": "application/json"
//             }
//         });
        
    

//         // const admin =  result.data;
//         // res.render("adminpro.ejs", { admin });
//         // res.json(result.data);
//         // console.log(da);
//         // res.send(da);
//         // res.render("adminpro.ejs");
//          admin = result.data[0]; // If it's an array
//         // console.log(admin);
//         if(result.status == 200){
//             return cb(null,admin);
//         }
//         else{
//             return cb("User not found");
//         }
//         // res.render("adminpro.ejs", { admin });
//     }
//     catch(err){
//         res.send(err);
//     }

// }));

// chatgpt
passport.use(new Strategy({ usernameField: 'email' }, async function verify(email, password, cb) {
    try {
        const response = await axios.post(`${API_URL}/admin/login`, { email, password });
        const admin = response.data[0];

        if (!admin) {
            return cb(null, false, { message: "User not found" });
        }

        return cb(null, admin);
    } catch (err) {
        return cb(err);
    }
}));



passport.serializeUser((user,cb)=>{
    cb(null,user);
});

passport.deserializeUser((user,cb)=>{
    cb(null,user);
});


app.listen(port,()=>{
    console.log(`Server is running on ${port}`);
});