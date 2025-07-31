if(process.env.NODE_ENV != "production") {
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const multer = require("multer");

const helmet = require("helmet");
const csurf = require("csurf");

// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL;

main()
    .then(() => {
        console.log("Connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

async function main(){
    await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended : true }));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", () => {
    console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // ONLY HTTPS in production
        sameSite: "lax"
    },
};

// app.get("/", (req, res) => {
//     res.send("Hi, I am root");
// });

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// app.get("/demouser", async (req, res) => {
//   let fakeUser = new User({
//     email: "student@gmail.com",
//     username: "delta-student"
//   });

//   let registeredUser = await User.register(fakeUser, "helloworld");
//   res.send(registeredUser);
// });


// Security headers
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://use.fontawesome.com"],
      styleSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "https://use.fontawesome.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "https://use.fontawesome.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
    },
  })
);

// CSRF protection (after session)
app.use(csurf());

// Pass CSRF token to all views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// ✅ Root route first (important for Google meta verification)
app.get("/", (req, res) => {
    res.redirect("/listings"); // or res.render("home");
});

// ✅ Google verification route - must come before routers
app.get("/googleee3add961647927.html", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/googleee3add961647927.html"));
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// app.all("/*splat", (req, res, next) => {
//     next(new ExpressError(404, "Page Not Found!"));
// });

app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;

    // 🔥 Multer: too many images
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
            req.flash("error", "You cannot upload more than 10 images.");
        } else if (err.code === "LIMIT_FILE_SIZE") {
            req.flash("error", "File size too large. Maximum allowed size is 10 MB.");
        } else {
            req.flash("error", err.message);
        }

        if (req.originalUrl.includes("/edit")) {
            const id = req.params?.id || req.body?.id || "";
            return res.redirect(`/listings/${id}/edit`);
        }
        return res.redirect("/listings/new");
    }

    // 🔥 ExpressError (custom validation error)
    if (err instanceof ExpressError) {
        req.flash("error", err.message || "Validation failed.");
        if (req.originalUrl.includes("/edit")) {
            const id = req.params?.id || req.body?.id || "";
            return res.redirect(`/listings/${id}/edit`);
        }
        return res.redirect("/listings/new");
    }

    // 🔥 Unknown error
    const message = err.message || "Something went wrong!";
    res.status(statusCode).render("error.ejs", { err: { message, statusCode } });
});

const port = process.env.PORT || 8080; // fallback to 8080 locally
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
