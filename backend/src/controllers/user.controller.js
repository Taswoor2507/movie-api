import User from '../models/user.model.js';
import sendEmail from '../utils/email.send.js';
import jwt from 'jsonwebtoken';
import ApiError from '../utils/ErrorHandler.util.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const generateToken = (user) => {
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRE });
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE });
  return { accessToken, refreshToken };
};

const registerUser = async (req, res, next) => {
  const { username, email, fullName } = req.body;

  if (!username || !email || !fullName) {
    return next(new ApiError(400, 'All fields are required'));
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.status === 'Pending') {
        const emailHtml = `
          <p>Dear ${existingUser.fullName},</p>
          <p>Your account is pending activation. Please verify your email by clicking the link below:</p>
          <p><a href="${req.protocol}://${req.get("host")}/api/users/verify/${existingUser._id}">Verify Email</a></p>
        `;
        await sendEmail(email, 'Email Verification', emailHtml);

        return res.status(400).json({ message: 'Verification email sent' });
      }
      return next(new ApiError(400, 'User already exists'));
    }

    const newUser = new User({ username, email, fullName });
    await newUser.save();

    const emailHtml = `
      <p>Dear ${fullName},</p>
      <p>Your account has been created successfully.</p>
      <p>Username: ${username}</p>
      <p>Status: Pending</p>
      <p>Please verify your email by clicking the link below:</p>
      <p><a href="${req.protocol}://${req.get("host")}/api/users/verify/${newUser._id}">Verify Email</a></p>
    `;
    await sendEmail(email, 'Email Verification', emailHtml);

    res.status(201).json({ message: 'User registered successfully and verification email sent', user: newUser });
  } catch (error) {
    console.error('Error during user registration:', error);
    next(new ApiError(500, 'An error occurred while registering the user', [], error.stack));
  }
};

const verifyUser = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    res.send(`
      <html>
      <body>
        <p>User: ${user.username}</p>
        <p>Current Status: ${user.status}</p>
        <p>Do you want to activate your account?</p>
        <form action="/api/users/activate/${userId}" method="post">
          <button type="submit">Yes</button>
        </form>
      </body>
      </html>
    `);
  } catch (error) {
    next(new ApiError(500, 'An error occurred while verifying the user', [], error.stack));
  }
};

const activateUser = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    user.status = 'Active';

    const { accessToken, refreshToken } = generateToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({ message: 'User activated successfully', accessToken, refreshToken });
  } catch (error) {
    return next(new ApiError(500, 'An error occurred while activating the user', [], error.stack));
  }
};

const findAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (error) {
    return next(new ApiError(500, 'An error occurred while retrieving users', [], error.stack));
  }
};

const deleteUser = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    user.status = 'Pending';
    user.refreshToken = null;
    await user.save();

    res.status(200).json({ message: 'User status set to pending and refresh token removed successfully' });
  } catch (error) {
    next(new ApiError(500, 'An error occurred while updating the user status', [], error.stack));
  }
};

const updateUser = async (req, res, next) => {
  const { userId } = req.params;
  const { username, fullName, email } = req.body;

  if (!username || !fullName || !email) {
    return next(new ApiError(400, 'All fields are required'));
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    if (user.status !== 'Active') {
      return next(new ApiError(400, 'User is not active'));
    }

    user.username = username;
    user.fullName = fullName;
    user.email = email;
    await user.save();

    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    next(new ApiError(500, 'An error occurred while updating the user', [], error.stack));
  }
};

const refreshAccessToken = async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new ApiError(400, 'Refresh token is required'));
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    if (user.refreshToken !== refreshToken) {
      return next(new ApiError(403, 'Invalid refresh token'));
    }

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRE });

    res.status(200).json({ accessToken });
  } catch (error) {
    next(new ApiError(500, 'An error occurred while refreshing the access token', [], error.stack));
  }
};

export default {
  registerUser,
  verifyUser,
  activateUser,
  findAllUsers,
  deleteUser,
  updateUser,
  refreshAccessToken
};
