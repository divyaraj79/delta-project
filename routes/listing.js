const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer  = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

router
    .route("/")
    .get(wrapAsync(listingController.index))    
    .post(
        isLoggedIn,
        upload.array('listing[images]', 10),
        validateListing,
        wrapAsync(listingController.createListing)
    );

// New Route
router.get("/new", isLoggedIn, listingController.renderNewForm);

// Autocomplete API
router.get('/autocomplete', async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.json([]);
  }

  // Search title/location/country that starts with or contains the query
  const listings = await Listing.find({
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { location: { $regex: query, $options: 'i' } },
      { country: { $regex: query, $options: 'i' } },
    ]
  }).limit(5).select('title location country'); // limit and project fields

  res.json(listings);
});

router
    .route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(
        isLoggedIn, 
        isOwner, 
        upload.array('listing[images]', 10),
        validateListing, 
        wrapAsync(listingController.updateListing)
    )
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

// Edit Route
router.get(
    "/:id/edit", 
    isLoggedIn, 
    isOwner, 
    wrapAsync(listingController.renderEditForm)
);

module.exports = router;