import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'Pending',
  },
  refreshToken: {
    type: String
  },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;
