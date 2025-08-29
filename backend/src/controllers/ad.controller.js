const Ad = require('../models/ad.model');

exports.getAllAds = async (req, reply) => {
  try {
    const ads = await Ad.find().populate('advertiserId', 'name hotelname address');
    console.log('Fetched Ads:', ads);

    // Fastify way
    return reply.code(200).send(ads);
  } catch (err) {
    console.error('Error fetching ads:', err);
    return reply.code(500).send({ message: 'Server error' });
  }
};


// Optional: fetch single ad
exports.getAdById = async (req, reply) => {
  try {
    const ad = await Ad.findById(req.params.id)
      .populate('advertiserId', 'name hotelname address');

    if (!ad) {
      return reply.code(404).send({ message: 'Ad not found' });
    }

    return reply.code(200).send(ad);
  } catch (err) {
    console.error('Error fetching ad:', err);
    return reply.code(500).send({ message: 'Server error' });
  }
};
