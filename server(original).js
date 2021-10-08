require('dotenv').config()

const express = require('express')
const session = require('express-session')
const passport = require('passport')
const flash = require('connect-flash')
const bodyParser = require('body-parser')

const pool = require('./config/database.js')

const app = express()

var url = require('url');
var cors = require('cors');
const { Console } = require("console");
const { SSL_OP_TLS_D5_BUG } = require("constants");

//-----------for file upload---------------

var formidable = require("formidable");
var fs = require("fs");
//const { values } = require('sequelize/types/lib/operators')



app.use(express.static(__dirname + '/uploads'));

//--------------------------

const PORT = process.env.PORT || 3000

//const routes = require('./routes/index')

app.use(express.static(__dirname + '/views'));


app.use(cors());

app.set('view engine', 'ejs')
app.use(session({
    secret: 'thatsecretthinggoeshere',
    resave: false,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json())
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())

app.use(function(req, res, next){
    res.locals.message = req.flash('message');
    next();
});

//app.use('/', routes)
require('./config/passport')(passport)

app.listen(PORT, () => {
    console.log(`Application server started on port: ${PORT}`)
})

//--------------------enable it for admin registration------------//
app.get('/admin_registration', (req, res) => {
  res.render('add_user');
})

app.post('/register', (req, res, next) => {
      let user = (req.body.username).toLowerCase()
      let pass = req.body.password
      let passConf = req.body.passConf
      //let user_id = req.body.user_id
      let name = req.body.name
      let phone = req.body.phone
      let email = req.body.email
      if (user.length === 0 || pass.length === 0 || passConf.length === 0) {
          req.flash('message', 'You must provide a username, password, and password confirmation.')
          res.redirect('/add_user')
      } else if (pass != passConf) {
          req.flash('message', 'Your password and password confirmation must match.')
          res.redirect('/add_user')
      } else {
        pool.query(
          `insert into mlm_user(username, name, mobile, email)
            values($1, $2, $3, $4)`,
          [user, name, phone, email],
           (err, results) => {
             if (err) {
               throw err;
             }
             
             next();
           }
         );
          
      }
}, passport.authenticate('register', {
  successRedirect : '/logout',
  failureRedirect : '/404-not-found',
  failureFlash : true
}))

app.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
      req.flash('message', 'Your are already logged in.')
      res.redirect('/')
  } else {
      res.render('login', {
          title: 'Login',
          user: req.user,
          message: res.locals.message
      })
  }
})

app.post('/login', (req, res, next) => {
  if (req.isAuthenticated()) {
      req.flash('message', 'You are already logged in.')
      res.redirect('/')
  } else {
      let user = (req.body.username).toLowerCase()
      let pass = req.body.password
      if (user.length === 0 || pass.length === 0) {
          req.flash('message', 'You must provide a username and password.')
          res.redirect('/login')
      } else {
          next()
      }
  }
}, passport.authenticate('login', {
  successRedirect : '/',
  failureRedirect : '/login',
  failureFlash : true
}))


app.get('/logout', (req, res) => {
  if (req.isAuthenticated()) {
      console.log('User [' + req.user.username + '] has logged out.')
      req.logout()
      res.redirect('/login');
  } else {
      res.redirect('/login')
  }
})

app.post('/updpass', (req, res, next) => {
  if (req.isAuthenticated()) {
      let password = req.body.password
      let newpass = req.body.newpass
      let newpassconf = req.body.newpassconf
      if (password.length === 0 || newpass.length === 0 || newpassconf.length === 0) {
          req.flash('message', 'You must provide your current password, new password, and new password confirmation.')
          res.redirect('/edit-account')
      } else if (newpass != newpassconf) { 
          req.flash('message', 'Your password and password confirmation must match.')
          res.redirect('/edit-account')
      } else {
          next()
      }
  } else {
      res.redirect('/update_password')
  }
}, passport.authenticate('updatePassword', {
  successRedirect : '/logout',
  failureRedirect : '/error',
  failureFlash : true
}))

//-------------------------Admin panel Routings---------------------//

app.get("/", (req, res) =>  {
  res.render("index.ejs");
})

app.get("/heading_picture", (req, res) =>  {
  res.render("heading_picture.ejs");
})

app.get("/product_details", (req, res) =>  {
  res.render("product_details.ejs");
})

app.get("/advertise_image", (req, res) =>  {
  res.render("advertisement.ejs");
})

app.get("/reviews", (req, res) =>  {
  res.render("review.ejs");
})

app.get("/contact", (req, res) =>  {
  res.render("contact.ejs");
})

app.get("/update_profile", (req, res) =>  {
  res.render("profile.ejs");
})

app.get("/update_password", (req, res) =>  {
  res.render("settings.ejs");
})

app.get("/statistics", (req, res) =>  {
  res.render("statistics.ejs");
})

app.get("/view_news", (req, res) =>  {
  res.render("upload_news.ejs");
})

app.get("/view_notification", (req, res) =>  {
  res.render("upload_notification.ejs");
})

app.get("/view_rewards", (req, res) =>  {
  res.render("upload_rewards.ejs");
})

app.get("/view_users", (req, res) =>  {
  res.render("user_list.ejs");
})


var distributor_id;

app.get("/user_distributor_profile", (req, res) =>  {

  var data = url.parse(req.url, true);
  data = data.query;

  distributor_id = data.user_id;

  res.render("user_distributor_profile.ejs");
})


var franchise_id;

app.get("/user_franchise_profile", (req, res) =>  {

  var data = url.parse(req.url, true);
  data = data.query;

  franchise_id = data.user_id;

  res.render("user_franchise_profile.ejs");
})

app.get("/logout", (req, res) =>  {
  res.render("login.ejs");
})

//---------------------------api--------------------//

//-----------------------------Add Header Image--------------------------------

app.post("/header_image1/add", async (req, res) => {
  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {

    var extension = '.jpg';
    
    var newPath = "uploads/user_banner/1" + extension;
    fs.rename(files.header_image1.path, newPath, function (errorRename) {
         console.log("file renamed")
    });
  })
  res.redirect("/heading_picture");
});

app.post("/header_image2/add", async (req, res) => {
  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {

    var extension = '.jpg';
    
    var newPath = "uploads/user_banner/2" + extension;
    fs.rename(files.header_image2.path, newPath, function (errorRename) {
         console.log("file renamed")
    });
  })
  res.redirect("/heading_picture");
});

app.post("/header_image3/add", async (req, res) => {
  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {

    var extension = '.jpg';
    
    var newPath = "uploads/user_banner/3" + extension;
    fs.rename(files.header_image3.path, newPath, function (errorRename) {
         console.log("file renamed")
    });
  })
  res.redirect("/heading_picture");
});

//-----------------------------------Add Product Image-------------------------

app.post("/product/add", async (req, res) => {

  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {
     
    var product_category = fields.product_category;
    var product_name = fields.product_name;
    var product_price = fields.product_price;
    var product_details = fields.product_details;
    var product_more_info = fields.product_more_info;

    console.log(product_category, product_name, product_price, product_details, product_more_info)
    
    let errors = [];

    if (!files.product_image.path || !product_category || !product_name || !product_price || !product_details) {
      errors.push({ message: "Please enter all fields" });
    }

    console.log(errors);
    if (errors.length > 0) {
      res.redirect("/product_details");
    }else{

      pool.query(
        `INSERT INTO product (product_category, product_name, product_price, product_details, product_more_info)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id`,
        [product_category, product_name, product_price, product_details, product_more_info],
        (err, results) => {
          if (err) {
            throw err;
          }
          var data = results.rows;
          var product_id = data[0].id;

          var extension = '.jpg';
          var newPath1 = "uploads/product_image/product" + product_id + extension;
          fs.rename(files.product_image.path, newPath1, function (errorRename) {
               console.log("file renamed")
          });
          res.redirect("/product_details");
        }
      );
    }
  })
});

app.get("/product/getdata", async (req, res) => {
  pool.query(
   "select * from product", 
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.get("/product/getdata/edit", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query(
   "select * from product where id=$1",
   [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.post("/product/update", async (req, res) => {
  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {

    var product_id = fields.product_id;
    var product_name = fields.product_name_id;
    var product_price = fields.product_price_id;
    var product_details = fields.product_details_id;
    var product_more_info = fields.product_more_info_id;

    pool.query(
      `UPDATE product 
      set product_name = $1, product_price = $2, product_details = $3, product_more_info = $4 where id = $5`,
      [product_name, product_price, product_details, product_more_info, product_id],
       (err, results) => {
         if (err) {
           throw err;
         }
         if(!files.product_image_id.path){
            res.redirect("/product_details");
         }else{
          var extension = '.jpg';
          var newPath = "uploads/product_image/product"+ product_id + extension;
          fs.rename(files.product_image_id.path, newPath, function (err) {
            if (err) {
                console.log('err:', err);
                throw err;
            }else{
              console.log("file renamed")
            }
            res.redirect("/product_details");
          });
         }
       }
     );
  })
});

app.get("/product/remove", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query(
   "delete from product where id = "  + id + "",
    (err, results) => {
      if (err) {
        throw err;
      }
      fs.unlink('uploads/product_image/product'+ id +'.jpg', function (err) {
        if (err) throw err;
        console.log('File deleted!');
      }); 
      res.send();
    }
  );
});

//--------------------------Add Advertisement---------------------------------------

app.post("/add_image1/add", async (req, res) => {
  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {

    var extension = '.jpg';
    
    var newPath = "uploads/advertisement/1" + extension;
    fs.rename(files.add_image1.path, newPath, function (errorRename) {
         console.log("file renamed")
    });
  })
  res.redirect("/advertise_image");
});

app.post("/add_image2/add", async (req, res) => {
  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {

    var extension = '.jpg';
    
    var newPath = "uploads/advertisement/2" + extension;
    fs.rename(files.add_image2.path, newPath, function (errorRename) {
         console.log("file renamed")
    });
  })
  res.redirect("/advertise_image");
});

app.post("/advertisement/add", async (req, res) => {

  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {
     
    var discount = fields.discount;
    var tag_line = fields.tag_line;
    var validation_date = fields.validation_date;

    console.log(discount, tag_line, validation_date)
    
    let errors = [];

    if (!files.advertisement_image.path || !discount || !validation_date) {
      errors.push({ message: "Please enter all fields" });
    }

    console.log(errors);
    if (errors.length > 0) {
      res.redirect("/advertise_image");
    }else{

      pool.query(
        `INSERT INTO advertisement (discount, tag_line, validation_date)
            VALUES ($1, $2, $3)
            RETURNING id`,
        [discount, tag_line, validation_date],
        (err, results) => {
          if (err) {
            throw err;
          }
          var data = results.rows;
          var advertisement_id = data[0].id;

          var extension = '.jpg';
          var newPath1 = "uploads/advertisement/advertisement_final" + advertisement_id + extension;
          fs.rename(files.advertisement_image.path, newPath1, function (errorRename) {
               console.log("file renamed")
          });
          res.redirect("/advertise_image");
        }
      );
    }
  })
});

app.get("/advertisement/getdata", async (req, res) => {
  pool.query(
   "select * from advertisement", 
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.get("/advertisement/getdata/edit", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query(
   "select * from advertisement where id=$1",
   [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.get("/advertisement/remove", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query(
   "delete from advertisement where id = "  + id + "",
    (err, results) => {
      if (err) {
        throw err;
      }
      fs.unlink('uploads/advertisement/advertisement_final'+ id +'.jpg', function (err) {
        if (err) throw err;
        console.log('File deleted!');
      }); 
      res.send();
    }
  );
});

//----------------------------------Add Review-------------------------------------------------------

app.post("/review/add", async (req, res) => {

  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {
     
    var name = fields.name;
    var feedback = fields.feedback;

    console.log(name, feedback)
    
    let errors = [];

    if (!files.review_image.path || !name || !feedback) {
      errors.push({ message: "Please enter all fields" });
    }

    console.log(errors);
    if (errors.length > 0) {
      res.redirect("/reviews");
    }else{

      pool.query(
        `INSERT INTO review (name, feedback)
            VALUES ($1, $2)
            RETURNING id`,
        [name, feedback],
        (err, results) => {
          if (err) {
            throw err;
          }
          var data = results.rows;
          var review_id = data[0].id;

          var extension = '.jpg';
          var newPath1 = "uploads/review/review" + review_id + extension;
          fs.rename(files.review_image.path, newPath1, function (errorRename) {
               console.log("file renamed")
          });
          res.redirect("/reviews");
        }
      );
    }
  })
});

app.get("/review/getdata", async (req, res) => {
  pool.query(
   "select * from review", 
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.get("/review/getdata/edit", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query(
   "select * from review where id=$1",
   [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.get("/review/remove", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query(
   "delete from review where id = "  + id + "",
    (err, results) => {
      if (err) {
        throw err;
      }
      fs.unlink('uploads/review/review'+ id +'.jpg', function (err) {
        if (err) throw err;
        console.log('File deleted!');
      }); 
      res.send();
    }
  );
});

//---------------------------Contact Details---------------------------------


app.post("/contact/add", async (req, res) => {

  let { address, number, mail, facebook, instagram, youtube } = req.body;

  console.log( address, number, mail, facebook, instagram, youtube );

  let errors = [];
  if (!address || !number || !mail) {
    errors.push({ message: "Please enter all fields" });
  }

  console.log(errors);
  if (errors.length > 0) {
    res.redirect("/contact");
  } else{

        pool.query(
          `INSERT INTO contact (address, number, mail, facebook, instagram, youtube)
              VALUES ($1, $2, $3, $4, $5, $6)`,
          [address, number, mail, facebook, instagram, youtube],
          (err, results) => {
            if (err) {
              throw err;
            }
            res.redirect("/contact");
          }
        );
    }
});

app.get("/contact/getdata", async (req, res) => {
  pool.query(
   "select * from contact", 
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.get("/contact/getdata/edit", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query(
   "select * from contact where id=$1",
   [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.get("/contact/remove", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query(
   "delete from contact where id = "  + id + "",
    (err, results) => {
      if (err) {
        throw err;
      }
      res.send();
    }
  );
});

//--------------------Update Admin Details---------------------------

app.get("/admin_details/getdata", async (req, res) => {
  pool.query(
   "select * from users where username = 'admin'",
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.post("/admin_details/edit", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var username = data.username;
  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {
    var admin_name_form = fields.admin_name_form;
    var admin_designation_form = fields.admin_designation_form;
    var admin_mail_form = fields.admin_mail_form;
    var admin_phone_form = fields.admin_phone_form;
    var admin_address_form = fields.admin_address_form;
    var admin_fb_form = fields.admin_fb_form;
    var admin_twitter_form = fields.admin_twitter_form;
    var admin_instagram_form = fields.admin_instagram_form;
    var admin_linkedin_form = fields.admin_linkedin_form;
    console.log(admin_name_form, admin_designation_form, admin_mail_form, admin_phone_form, admin_address_form, admin_fb_form, admin_twitter_form, admin_instagram_form, admin_linkedin_form, username)
    var extension = '.jpg';
    var newPath1 = "uploads/admin/" + username + extension;
    fs.rename(files.admin_image_form.path, newPath1, function (errorRename) {
         console.log("file renamed")
    });
    let errors = [];
    if (!files.admin_image_form.path) {
      errors.push({ message: "Please enter all fields" });
    }
    console.log(errors);
    if (errors.length > 0) {
      res.redirect("/update_profile");
    }else{
      pool.query(
        `UPDATE users 
        SET name=$1, designation=$2, address=$3, email=$4, phone=$5, facebook=$6, twitter=$7, linkedin=$8, instagram=$9
        WHERE username = ($10)`,
        [admin_name_form, admin_designation_form, admin_address_form, admin_mail_form, admin_phone_form, admin_fb_form, admin_twitter_form, admin_linkedin_form, admin_instagram_form, username],
        (err, results) => {
          if (err) {
            throw err;
          }
          res.redirect("/update_profile");
        }
      );
    }
  })
});

//--------------------------Update News Section-------------------------------

app.post("/news/add", async (req, res) => {

  let { news_title, news_details } = req.body;

  console.log( news_title, news_details );

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  let errors = [];
  if (!news_title || !news_details) {
    errors.push({ message: "Please enter all fields" });
  }

  console.log(errors);
  if (errors.length > 0) {
    res.redirect("/view_news");
  } else{
    var action_date = date_yyyy_mm_dd;
    var action_time = time_hh_mm_ss;

        pool.query(
          `INSERT INTO news (news_title, news_details, date, time)
              VALUES ($1, $2, $3, $4)`,
          [news_title, news_details, action_date, action_time],
          (err, results) => {
            if (err) {
              throw err;
            }
            res.redirect("/view_news");
          }
        );
    }
});

app.get("/news/getdata", async (req, res) => {
  pool.query(
   "select * from news", 
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.get("/news/getdata/edit", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query(
   "select * from news where id=$1",
   [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.get("/news/remove", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query(
   "delete from news where id = "  + id + "",
    (err, results) => {
      if (err) {
        throw err;
      }
      res.send();
    }
  );
});

//----------------------------------Add Notification Details----------------------------

app.post("/notification/add", async (req, res) => {

  let { notification_title, notification_details } = req.body;

  console.log( notification_title, notification_details );

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  let errors = [];
  if (!notification_title || !notification_details) {
    errors.push({ message: "Please enter all fields" });
  }

  console.log(errors);
  if (errors.length > 0) {
    res.redirect("/view_notification");
  } else{
    var action_date = date_yyyy_mm_dd;
    var action_time = time_hh_mm_ss;

        pool.query(
          `INSERT INTO notification (news_title, news_details, date, time)
              VALUES ($1, $2, $3, $4)`,
          [notification_title, notification_details, action_date, action_time],
          (err, results) => {
            if (err) {
              throw err;
            }
            res.redirect("/view_notification");
          }
        );
    }
});

app.get("/notification/getdata", async (req, res) => {
  pool.query(
   "select * from notification", 
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.get("/notification/getdata/edit", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query(
   "select * from notification where id=$1",
   [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.get("/notification/remove", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query(
   "delete from notification where id = "  + id + "",
    (err, results) => {
      if (err) {
        throw err;
      }
      res.send();
    }
  );
});

//----------------------Add Rewards-------------------------------------

app.post("/rewards/add", async (req, res) => {

  let { rewards_title, rewards_details } = req.body;

  console.log( rewards_title, rewards_details );

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  let errors = [];
  if (!rewards_title || !rewards_details) {
    errors.push({ message: "Please enter all fields" });
  }

  console.log(errors);
  if (errors.length > 0) {
    res.redirect("/view_rewards");
  } else{
    var action_date = date_yyyy_mm_dd;
    var action_time = time_hh_mm_ss;

        pool.query(
          `INSERT INTO rewards (rewards_title, rewards_details, date, time)
              VALUES ($1, $2, $3, $4)`,
          [rewards_title, rewards_details, action_date, action_time],
          (err, results) => {
            if (err) {
              throw err;
            }
            res.redirect("/view_rewards");
          }
        );
    }
});

app.get("/rewards/getdata", async (req, res) => {
  pool.query(
   "select * from rewards", 
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.get("/rewards/getdata/edit", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query(
   "select * from rewards where id=$1",
   [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.get("/rewards/remove", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query(
   "delete from rewards where id = "  + id + "",
    (err, results) => {
      if (err) {
        throw err;
      }
      res.send();
    }
  );
});


app.get("/distributor/getdata", async (req, res) => {
  

  pool.query(
    `select * from mlm_user
    where user_type = 'distributor'
    order by user_id`,
    
   
     (err, results) => {
       if (err) {
         throw err;
       }
       let data = results.rows;
       console.log(data)
       res.send(data);
     }
   );

   
});

app.get("/franchise/getdata", async (req, res) => {
  

  var data = url.parse(req.url, true);
  data = data.query;

  var sponsor_id = data.sponsor_id;
  

  pool.query(
    `select * from mlm_user
    where sponsor_id = $1
    order by user_id`,
    [sponsor_id],  
   
     (err, results) => {
       if (err) {
         throw err;
       }
       let data = results.rows;
       console.log(data)
       res.send(data);
     }
   );

   
});


app.get("/user_distributor_profile/getdata", async (req, res) => {
  
  pool.query(
    `select * from mlm_user
    where user_type = 'distributor' and user_id = $1`,
    [distributor_id],  
   
     (err, results) => {
       if (err) {
         throw err;
       }
       let data = results.rows;
       console.log(data)
       res.send(data);
     }
   );

   
});


app.get("/user_franchise_profile/getdata", async (req, res) => {
  
  pool.query(
    `select * from mlm_user
    where user_type = 'franchise' and user_id = $1`,
    [franchise_id],  
   
     (err, results) => {
       if (err) {
         throw err;
       }
       let data = results.rows;
       console.log(data)
       res.send(data);
     }
   );

   
});



app.post("/sell/add", async (req, res) => {

  let { distributor_id, distributor_name, discount_amount, product_name, product_quantity, product_amount } = req.body;

  var date_dd_mm_yyyy;
  console.log( distributor_id, distributor_name, discount_amount, product_name, product_quantity, product_amount );

  let errors = [];
  if (!distributor_id || !distributor_name || !discount_amount || !product_name || !product_quantity || !product_amount) {
    errors.push({ message: "Please enter all fields" });
  }

  console.log(errors);
  if (errors.length > 0) {
    res.redirect("/contact");
  } else{

        pool.query(
          `insert into sell (product_name, quantity, total_amount, user_id, date)
              VALUES ($1, $2, $3, $4, $5)`,
          [product_name, product_quantity, product_amount, distributor_id, date_dd_mm_yyyy],
          (err, results) => {
            if (err) {
              throw err;
            }
            //res.redirect("/");
            var purchased_amount = product_amount;
            var treeUserId = distributor_id;
            console.log(treeUserId)
            getSponsor();

            function getSponsor(){
              
              pool.query(
                `select sponsor_id, username from mlm_user
                  where user_id = $1`,
                [treeUserId],
                (err, results1) => {
                  if (err) {
                    throw err;
                  }
                  //res.redirect("/");
                  let data = results1.rows;
                  if(!results1.rows[0]){
                    var tree_sponsor_id;
                    var tree_username;
                  }else{
                    var tree_sponsor_id = data[0].sponsor_id;
                    var tree_username = data[0].username;
                  }
                  
                  if(!tree_sponsor_id || (tree_username == 'admin')){
                    res.redirect("/");
                  }else{
                    treeUserId = results1.rows[0].sponsor_id;
                    var comission;
                    if(parseInt(purchased_amount/2) >= parseInt(100000)){
                        comission = (parseInt(purchased_amount/2) * parseInt(35)) / parseInt(100);
                    }else if(parseInt(60000) <= parseInt(purchased_amount/2) <= parseInt(99999)){
                        comission = (parseInt(purchased_amount/2) * parseInt(30)) / parseInt(100);
                    }else if(parseInt(30000) <= parseInt(purchased_amount/2) <= parseInt(59999)){
                      comission = (parseInt(purchased_amount/2) * parseInt(25)) / parseInt(100);
                    }else if(parseInt(12000) <= parseInt(purchased_amount/2) <= parseInt(29999)){
                      comission = (parseInt(purchased_amount/2) * parseInt(20)) / parseInt(100);
                    }else if(parseInt(1) <= parseInt(purchased_amount/2) <= parseInt(11999)){
                      comission = (parseInt(purchased_amount/2) * parseInt(10)) / parseInt(100);
                    }else{
                      comission = 0;
                    }
                  

                    pool.query(
                      `insert into comission (user_id, amount) values($1, $2)`,
                      [treeUserId, comission],  
                     
                       (err, results) => {
                         if (err) {
                           throw err;
                         }
                         getSponsor();
                       }
                     );
                  }
      
                }
              );
            }

            
          }
        );
    }
});