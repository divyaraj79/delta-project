const Listing = require("../models/listing");
const mongoose = require("mongoose");
const ExpressError = require("../utils/ExpressError.js");
const { cloudinary } = require("../cloudConfig");

// Mapbox-sdk required requirements start 
// const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding'); 
// const mapToken = process.env.MAP_TOKEN;                                
// const geocodingClient = mbxGeocoding({ accessToken: mapToken });    
// Mapbox-sdk required end  

module.exports.index = async (req, res) => {
    const { q, filter } = req.query;

    let query = {};

    // If search query is present
    if (q && q.trim() !== "") {
        const regex = new RegExp(q, "i");
        query.$or = [
            { title: regex },
            { location: regex },
            { country: regex },
            { description: regex }
        ];
    }

    // If filter is selected
    if (filter && filter.trim() !== "") {
        query.filter = filter;
    }

    const allListings = await Listing.find(query);
    res.render("listings/index", {
        allListings,
        queryTerm: q || "",
        selectedFilter: filter || ""
    });
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
    if (!req.files || req.files.length === 0) {
        req.flash("error", "You must upload at least one image.");
        return res.redirect("/listings/new");
    }
    // let response = await geocodingClient.forwardGeocode({    // Mapbox code
    //     query: req.body.listing.location,
    //     limit: 1,
    // })
    // .send();

    const listingData = req.body.listing;

    if (listingData.filter === "") {
        delete listingData.filter;
    }

    const newListing = new Listing(listingData);
    newListing.owner = req.user._id;
    newListing.images = req.files.map(file => ({ url: file.path, filename: file.filename }));
 
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

    let originalImageUrl = listing.images[0].url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing , originalImageUrl });
};

module.exports.updateListing = async (req, res, next) => {
    const { id } = req.params;

    // Step 1: Find listing (do NOT update here)
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    // Step 2: Update listing fields from req.body.listing
    Object.assign(listing, req.body.listing);

    // Step 3: Handle image deletion
    let deleteFilenames = [];
    if (req.body.deleteImages) {
        deleteFilenames = req.body.deleteImages.split(',').filter(Boolean);

        // BEFORE deleting anything, check:
        if (deleteFilenames.length > 0 && listing.images.length === deleteFilenames.length) {
            req.flash("error", "You must keep at least one image.");
            return res.redirect(`/listings/${id}/edit`);
        }

        if (deleteFilenames.length > 0) {
            // Delete from Cloudinary
            for (let filename of deleteFilenames) {
                await cloudinary.uploader.destroy(filename);
            }

            // Pull from MongoDB images array
            listing.images = listing.images.filter(
                img => !deleteFilenames.includes(img.filename)
            );
        }
    }

    // Step 4: Handle image reordering
    if (req.body.imageOrder && req.body.imageOrder.trim() !== "") {
        const newOrder = req.body.imageOrder.split(',').filter(Boolean);
        listing.images.sort((a, b) => {
            return newOrder.indexOf(a.filename) - newOrder.indexOf(b.filename);
        });

        listing.markModified("images"); // Force save
    }

    // Step 5: Handle new uploads (while limiting total to 10 images)
    if (req.files && req.files.length > 0) {
        const currentImageCount = listing.images.length;
        const newImageCount = req.files.length;

        if (currentImageCount + newImageCount > 10) {
            // Optional: cleanup newly uploaded images from Cloudinary
            for (let file of req.files) {
                await cloudinary.uploader.destroy(file.filename);
            }

            req.flash("error", `You can only have a maximum of 10 images. You currently have ${currentImageCount}.`);
            return res.redirect(`/listings/${id}/edit`);
        }

        const newImages = req.files.map(file => ({
            url: file.path,
            filename: file.filename
        }));
        listing.images.push(...newImages);
    }

    // Step 6: Save and redirect
    await listing.save();

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