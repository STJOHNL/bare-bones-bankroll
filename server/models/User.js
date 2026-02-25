import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true },
    password: String,
    fName: String,
    lName: String,
    phone: String,
    role: {
      type: String,
      default: 'User',
    },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    resetToken: String,
    resetExpires: Date,
  },
  { timestamps: true }
)

// Function to hash users password before saving to the database
userSchema.pre('save', async function (next) {
  // Checks if users password is modified, if not continue
  if (!this.isModified('password')) {
    next()
  }

  // Hash updated password
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// Checks users password on login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

const User = mongoose.model('User', userSchema)

export default User
