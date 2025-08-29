const { Schema, model, mongoose } = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: { type: String },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },


    role: {
      type: String,
      enum: ['user', 'advertiser', 'admin'],
      default: 'user',
    },

    credit: {
      type: Number,
      default: 0,
      min: 0, // Ensure credit cannot be negative
    },

address: [
  {
    label: { type: String, trim: true }, // "Home", "Work", etc.
    fullAddress: { type: String, trim: true, required: true }, // e.g. "221B Baker Street, London"
    city: { type: String, trim: true, required: true },
    state: { type: String, trim: true, required: true },
    postalCode: { type: String, trim: true, required: true },
    mobileNo: { type: String, trim: true, required: true },

    // GeoJSON object for location
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
  },
],



},
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  if (this.password === 'google-oauth-user') return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.isPasswordMatch = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = model('User', userSchema);
