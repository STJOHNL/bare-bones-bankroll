import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

export const ROLES = ['User', 'Admin']

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String, select: false },
    fName: String,
    lName: String,
    // Kept for legacy data — never exposed by the API
    phone: String,
    role: {
      type: String,
      enum: ROLES,
      default: 'User',
    },
    // Incremented to invalidate every outstanding JWT for this user
    tokenVersion: { type: Number, default: 0 },
    // sha256 hex of the raw reset token; the raw token only lives in the email link
    resetTokenHash: { type: String, select: false },
    resetExpires: { type: Date, select: false },
  },
  { timestamps: true }
)

userSchema.index({ resetTokenHash: 1 }, { sparse: true })

// Function to hash users password before saving to the database
userSchema.pre('save', async function (next) {
  // Checks if users password is modified, if not continue
  if (!this.isModified('password')) return next()

  // Hash updated password
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Checks users password on login (requires the document to be loaded with +password)
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password || typeof enteredPassword !== 'string') return false
  return await bcrypt.compare(enteredPassword, this.password)
}

// Fields that are safe to return to the client
userSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    fName: this.fName,
    lName: this.lName,
    email: this.email,
    role: this.role,
  }
}

const User = mongoose.model('User', userSchema)

export default User
