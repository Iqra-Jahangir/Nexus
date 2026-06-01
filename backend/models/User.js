const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['investor', 'entrepreneur'],
      required: true,
    },
    profileData: {
      bio: { type: String, default: '' },
      history: { type: String, default: '' },
      preferences: { type: String, default: '' },
    },
  },
  { timestamps: true } // auto adds createdAt and updatedAt
);

// automatically hashes password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('passwordHash')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  }
  next();
});

// method to check if entered password is correct
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);