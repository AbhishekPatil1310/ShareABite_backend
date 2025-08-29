const User = require("../models/user.model");
const Ad = require("../models/ad.model");
const { uploadToSupabase,deleteFromSupabase } = require("../services/supabase.service");

// Add address
const addAddress = async (req, reply) => {
  try {
    const { id } = req.params;
    const {
      label,
      fullAddress,
      city,
      state,
      postalCode,
      mobileNo,
      lat,
      lng,
    } = req.body;

    const user = await User.findById(id);
    if (!user) return reply.code(404).send({ message: "User not found" });

    user.address.push({
      label,
      fullAddress,
      city,
      state,
      postalCode,
      mobileNo,
      location: { type: "Point", coordinates: [lng, lat] },
    });

    await user.save();
    reply.send({ success: true, addresses: user.address });
  } catch (err) {
    console.error("Add address error:", err); // 👈 log actual error
    reply.code(500).send({ message: "Server error", error: err.message });
  }
};

// Get all addresses
const getAddresses = async (req, reply) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("address");
    if (!user) return reply.code(404).send({ message: "User not found" });

    reply.send(user.address); // sends array of addresses
  } catch (err) {
    reply.code(500).send({ message: "Server error", error: err.message });
  }
};


async function uploadAdHandler(req, reply) {
  console.log('[uploadAdHandler] Handler triggered ');

  const parts = req.parts();
  let productName = '', description = '', price = 0, adType = '',  advertiserEmail = '';
  let fileName = '', fileType = '', fileBuffer;

  for await (const part of parts) {
    if (part.file) {
      fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${part.filename}`;
      fileType = part.mimetype;

      const chunks = [];
      for await (const chunk of part.file) {
        chunks.push(chunk);
      }
      fileBuffer = Buffer.concat(chunks);
    } else {
      const val = part.value;
      switch (part.fieldname) {
        case 'productName': productName = val; break;
        case 'description': description = val; break;
        case 'price':
          price = Number(val); 
          break; case 'adType': adType = val; break;
        case 'advertiserId': advertiserEmail = val; break;
      }
    }
  }

  const user = await User.findOne({ email: advertiserEmail });
  if (!user) {
    console.error('[uploadAdHandler] No user found for email:', advertiserEmail);
    return reply.badRequest('Invalid advertiser email');
  }

  if (!fileBuffer || !fileType) {
    return reply.badRequest('Image file is required');
  }

  let imageUrl;
  try {
    imageUrl = await uploadToSupabase(fileBuffer, fileName, fileType);
  } catch (err) {
    console.error('[uploadAdHandler] Supabase upload failed ❌', err);
    return reply.internalServerError('Failed to upload image');
  }

  try {
    const ad = await Ad.create({
      advertiserId: user._id, 
      productName,
      imageUrl,
      description,
      price,
      adType,
    });
    return reply.send({ success: true, ad });
  } catch (err) {
    console.error('[uploadAdHandler] MongoDB save failed ❌', err);
    return reply.internalServerError('Failed to save ad');
  }
}




// Get all advertisers
async function getAllAdvertisers (req, reply) {
  try {
    const advertisers = await User.find({ role: 'advertiser' }).select('name companyName');
    return reply.code(200).send(advertisers);
  } catch (err) {
    console.error('Error fetching advertisers:', err);
    return reply.code(500).send({ message: 'Server error' });
  }
};

// Get ads by advertiserId
async function getAdsByAdvertiser(req, reply) {
  try {
    const { id: advertiserId } = req.params; // match the route param
    const ads = await Ad.find({ advertiserId })
      .populate('advertiserId', 'name companyName address');
    return reply.code(200).send(ads);
  } catch (err) {
    console.error('Error fetching ads for advertiser:', err);
    return reply.code(500).send({ message: 'Server error' });
  }
}

async function getMyAds(req, reply) {
  try {
    const { id: advertiserId } = req.params; // route param
    const ads = await Ad.find({ advertiserId })
      .populate("advertiserId", "name companyName address")
      .sort({ createdAt: -1 });

    return reply.code(200).send(ads);
  } catch (err) {
    console.error("Error fetching ads for advertiser:", err);
    return reply.code(500).send({ message: "Server error" });
  }
}

// Update ad
async function updateAd(req, reply) {
  const { id } = req.params;
  const updates = req.body;

  try {
    if (!id) {
      return reply.badRequest({ message: "Ad ID is required" });
    }

    const updatedAd = await Ad.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedAd) {
      return reply.code(404).send({ message: "Ad not found" });
    }

    return reply.send({
      success: true,
      message: "Ad updated successfully",
      ad: updatedAd,
    });
  } catch (err) {
    console.error("Error updating ad:", err);
    return reply
      .code(500)
      .send({ message: "Update failed", error: err.message });
  }
}


// Delete ad
async function deleteAd(req, reply) {
  try {
    const { id } = req.params;
    if (!id) {
      return reply.badRequest("Missing ad ID");
    }

    // 1. Find the ad first
    const ad = await Ad.findById(id);
    if (!ad) {
      return reply.notFound("Ad not found");
    }

    // 2. Delete image from Supabase if it exists
    if (ad.imageUrl) {
      // Extract relative file path from public URL
      const filePath = ad.imageUrl.replace(
        `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/`,
        ""
      );

      try {
        await deleteFromSupabase(filePath);
        console.log("Image deleted from Supabase:", filePath);
      } catch (err) {
        console.error("Failed to delete image from Supabase:", err.message);
        // if you want to fail strictly, uncomment:
        // return reply.internalServerError("Failed to delete image from Supabase");
      }
    }

    // 3. Delete the ad from MongoDB
    await ad.deleteOne();

    return reply.send({
      success: true,
      message: "Ad and image deleted successfully",
    });
  } catch (err) {
    req.log.error(err, "[deleteAd] Failed to delete ad");
    return reply.internalServerError("Failed to delete ad");
  }
}


module.exports = { addAddress, getAddresses,uploadAdHandler,getAdsByAdvertiser,getAllAdvertisers,getMyAds,updateAd,deleteAd };
