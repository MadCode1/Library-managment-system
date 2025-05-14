import express from 'express';
import mysql from "mysql2";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";



const db = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"password",
    database:"librarymanagement"
});

const app = express();
const port = 4000;
app.use(express.json());

app.use(bodyParser.urlencoded({extended:true}));

db.connect((err)=>{
    if (err) throw err;
    console.log(`Database is connected successfully!`);
    db.query("SHOW tables",(err,result)=>{
        if(err) throw err;
        console.log(result);
    });
});

app.post("/admin/register",(req,res)=>{

    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    console.log(`INSERT INTO Admins (name, email, password) VALUES (${name},${email},${password})`);
    var query = `INSERT INTO Admins (name, email, password) VALUES (?, ?, ?)`;
    db.query(query, [name, email, password], (err, result) => {
        if (err) throw err;
        console.log(result);
        res.status(200).send({result});
    });
});
 
app.post("/user/register",(req,res)=>{

    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    const address =req.body.address;

    console.log(`INSERT INTO Users (name, email, phone, address) VALUES (${name},${email},${phone},${address})`);
    var query = `INSERT INTO Users (name, email, phone, address) VALUES (?, ?, ?, ?) RETURNING *`;
    const results =  db.query(query, [name, email, phone, address], (err, result) => {
        if (err) throw err;
        console.log(results);
        res.status(200).send({results});
    });
});
 

app.get("/user/details",(req,res)=>{
    db.query("SELECT * FROM Users",(err,result)=>{
        if(err) throw err;
        res.json(result);
    });
});

app.get("/admin/details",(req,res)=>{
    db.query("SELECT * FROM Admins",(err,result)=>{
        if(err) throw err;
        res.json(result);
    });
});

// //Get a specific Admin details

app.post("/admin/login",async (req, res) => {
    const email = req.body.email;
    const loginPassword = req.body.password;
    const query = `SELECT * FROM Admins WHERE email = ?`;
   db.query(query, [email],(err,result)=>{
    if (err) throw err;
    const storedHashedPassword = result[0].password;
    const storedResult = result;
       bcrypt.compare(loginPassword, storedHashedPassword, (err, result) => {
            if (err) {
              console.error("Error comparing passwords:", err);
            } else {
              if (result) {
                console.log(storedResult);
                res.json(storedResult);
              } else {
                res.json("Incorrect Password");
              }
            }
          });
    // console.log(result[0].password);
    // res.json(result);
   }); 
   
});

app.post('/admin/dashboard', (req, res) => {
    let stats = {};

    db.query(`SELECT COUNT(*) AS total_books FROM Books`, (err, book) => {
      if (err) return res.send("Error fetching total books");
      stats.totalBooks = book[0].total_books;
  
      db.query(`SELECT SUM(copies_available) AS available_copies FROM Books`, (err, copies) => {
        if (err) return res.send("Error fetching copies");
        stats.availableCopies = copies[0].available_copies;
  
        db.query(`SELECT COUNT(*) AS active_borrows FROM Borrow WHERE status = 'borrowed'`, (err, activeBorrows) => {
          if (err) return res.send("Error fetching borrows");
          stats.activeBorrows = activeBorrows[0].active_borrows;
  
          db.query(`SELECT COUNT(*) AS overdue_books FROM Borrow WHERE status = 'borrowed' AND due_date < CURDATE()`, (err, overdues) => {
            if (err) return res.send("Error fetching overdue books");
            stats.overdueBooks = overdues[0].overdue_books;
  
            db.query(`SELECT COUNT(*) AS total_users FROM Users`, (err, users) => {
              if (err) return res.send("Error fetching users");
              stats.totalUsers = users[0].total_users;
  
              db.query(`SELECT SUM(amount) AS total_collected FROM Fine WHERE paid = TRUE`, (err, collected) => {
                if (err) return res.send("Error fetching fine collected");
                stats.totalCollected = collected[0].total_collected || 0;
  
                db.query(`SELECT SUM(amount) AS total_pending FROM Fine WHERE paid = FALSE`, (err, pending) => {
                  if (err) return res.send("Error fetching fine pending");
                  stats.totalPending = pending[0].total_pending || 0;
  
                  
                  res.json({ stats });
                });
              });
            });
          });
        });
      });
    });
  });
  


// app.post("/book/manage",async (req,res)=>{
//     db.query("SELECT * FROM Books",(err,result)=>{
//         if (err) throw err;
//         res.json(result)
//     })
// });





app.get("/get/book",async (req,res)=>{
    db.query("SELECT * FROM Books",(err,result)=>{
        if (err) throw err;
        res.json(result)
    })
    
});



// 


// Get one book
app.get('/book/:id', (req, res) => {
  db.query("SELECT * FROM Books WHERE id = ?", [req.params.id], (err, result) => {
    if (err) throw err;
    res.json(result[0]);
  });
});

// Add book 
app.post('/book/add', (req, res) => {
  const { title, author, publisher, year_published, isbn, copies_available, total_copies, category, description } = req.body;
  db.query("INSERT INTO Books (title, author, publisher, year_published, isbn, copies_available, total_copies, category, description) VALUES (?, ?, ?, ?, ?)", 
    [book_id, title, author, publisher, year_published, isbn, copies_available, total_copies, category, description], 
    (err, result) => {
      if (err) throw err;
      res.json({ success: true });
    });
});

// Edit book
app.put('/book/edit/:id', (req, res) => {
  const {title, author, publisher, year_published, isbn, copies_available, total_copies, category, description } = req.body;
  db.query("UPDATE Books SET title=?, author=?, category=?, isbn=?, status=? WHERE id=?", 
    [title, author, publisher, year_published, isbn, copies_available, total_copies, category, description, req.params.id], 
    (err, result) => {
      if (err) throw err;
      res.json({ success: true });
    });
});

// Delete book
app.delete('/book/delete/:id', (req, res) => {
  db.query("DELETE FROM Books WHERE id = ?", [req.params.id], (err, result) => {
    if (err) throw err;
    res.json({ success: true });
  });
});


// 

app.listen(port,()=>{
    console.log(`the server is running on ${port}`);
});