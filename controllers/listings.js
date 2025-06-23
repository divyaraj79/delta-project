const Listing = require("../models/listing");
const mongoose = require("mongoose");
const ExpressError = require("../utils/ExpressError.js");

// Mapbox-sdk required requirements start 
// const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding'); 
// const mapToken = process.env.MAP_TOKEN;                                
// const geocodingClient = mbxGeocoding({ accessToken: mapToken });    
// Mapbox-sdk required end  

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res, next) => {
    let { id } = req.params;

    // I have added it locally in case someone request for an listing having invalid id i.e. "/:id"
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ExpressError(400, 'Invalid listing ID.'));
    }

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");
    if(!listing) {
      req.flash("error", "Listing you requesting for does not exist!");
      return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
    // let response = await geocodingClient.forwardGeocode({    // Mapbox code
    //     query: req.body.listing.location,
    //     limit: 1,
    // })
    // .send();


    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename};
 
    // newListing.geometry = response.body.features[0].geometry;   // Mapbox code

    // let savedListing = await newListing.save();               // Mapbox code
    // console.log(savedListing);
    // req.flash("success", "New Listing Created!");
    // res.redirect("/listings");

    await newListing.save();                   //Original Code
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing) {
      req.flash("error", "Listing you requesting for does not exist!");
      return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing , originalImageUrl });
};

module.exports.updateListing = async (req, res, next) => {
    let { id } = req.params;    
    let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleated!");
    res.redirect("/listings");
};