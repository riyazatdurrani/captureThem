require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");

const passportLocalMongoose = require("passport-local-mongoose");
//const methodOverride = require("method-override");
const multer = require("multer");
const path = require("path");
const app = express();

app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(methodOverride("_method"));
app.set("views", "./views");
app.set("view engine", "ejs");

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.SERVER, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true);
mongoose.set("useFindAndModify", false);

const commentSchema = new mongoose.Schema({
  comment: String,
  imagename: String,
});

const Comment = new mongoose.model("Comment", commentSchema);

const userSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: String,
  password: String,
  comments: [commentSchema],
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const indComment = new Comment({
  comment: "",
  imagename: "",
});

app.get("/", function (req, res) {
  res.render("welcomepage");
});

app.get("/signup", function (req, res) {
  res.render("signup");
});

app.get("/firstpage", function (req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.user.id, function (err, foundUser) {
      res.render("firstpage");
    });
  } else {
    res.redirect("/");
  }
});
app.get("/data", function (req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.user.id, function (err, foundUser) {
    res.render("data", { EJS: foundUser.comments });
    });
  } else {
    res.redirect("/firstpage");
  }
});


// app.post("/delete", function (req, res) {
//   if (req.isAuthenticated()) {
//     // User.findById(req.user.id,function(err, foundUser){
//     const checkedItemId = req.body.checkbox;
//     // User.findByIdAndRemove(checkedItemId, function(err){
//     //   if(!err){
//     //     console.log("successfully deleted");
//     //   }
//     // })
//     User.FindByIdAndUpdate(
//       "5eb27e878c872244146ecb59",
//       { $pull: { Comment: { _id: checkedItemId } } },
//       function (err, model) {
//         if (err) {
//           console.log(err);
//         }
//       }
//     );
//   } else {
//     res.redirect("/");
//   }
// });

app.post("/signup", function (req, res) {
  User.register(
    {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      username: req.body.username,
    },
    req.body.password,
    function (err) {
      if (err) {
        console.log(err);
        res.redirect("/signup");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/firstpage");
        });
      }
    }
  );
});

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

var uploads = multer({ storage: storage }).single("image");


app.post("/firstpage", uploads, function (req, res) {
  const indComment = new Comment({
    comment: req.body.text1,
    imagename: req.file.filename,
  });

  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.comments.push(indComment);
        foundUser.save(function () {
          res.render("one");
        });
      }
    }
  });
});



app.get("/one",function(req,res){
  if (req.isAuthenticated()) {
    User.findById(req.user.id, function (err, foundUser) {
      res.render("one");
    });
  } else {
    res.redirect("/firstpage");
  }
  });




app.post("/", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("one");
      });
    }
  });
});

app.post("/delete", function(req,res){
  if(req.isAuthenticated()) {
    User.findById(req.user.id,function(err, foundUser){
      if(err){
        console.log(err);
      }
      else{
        const uid = foundUser.id;                 //this is the User iD
        const checkedItemId = mongoose.Types.ObjectId(req.body.button);  //this is the comment ID
        console.log(checkedItemId);

        User.updateOne({_id: uid},{$pull :{comments:{_id :checkedItemId}}}, function(err, results){
          if(!err){
            console.log("successfully deleted");
            res.redirect("data")
          } else {
            console.log("error in deletion");
            res.redirect("/");
          }
        });
      }
    });
  } else {
    res.redirect("/");
  }
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.listen("3000", function () {
  console.log("server started on port 3000");
});
