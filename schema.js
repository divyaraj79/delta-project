const Joi = require('joi');

module.exports.listingSchema = Joi.object({
    listing : Joi.object({
        title : Joi.string().required(),
        description : Joi.string().required(),
        location : Joi.string().required(),
        country : Joi.string().required(),
        price : Joi.number().required().min(0),
        filter: Joi.string().valid("Trending", "Mountains", "Lakefront", "Tropical", "Arctic", "Desert", "Iconic cities").allow('', null),
        images: Joi.any().optional() // placeholder only
    }).required(),
    
    deleteImages: Joi.string().allow('', null).optional(),  // ✅ Allow this outside listing
    imageOrder: Joi.string().allow('', null).optional() 
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
      rating: Joi.number().required().min(1).max(5),
      comment: Joi.string().required(),
    }).required(),
});