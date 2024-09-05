import User from '../models/user.model.js';
import sendEmail from '../utils/email.send.js';
import jwt from 'jsonwebtoken';
import ApiError from '../utils/ErrorHandler.util.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const generateToken = (user) => {
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRE });
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE });
  return { accessToken, refreshToken };
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); 
};


const registerUser = async (req, res, next) => {
  const { username, email, fullName, password } = req.body;

  if (!username || !email || !fullName || !password) {
    return next(new ApiError(400, 'All fields are required'));
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.status === 'Pending') {
        existingUser.status = 'Active';
        await existingUser.save();
        return res.status(200).json({ message: 'Your account is activated.', existingUser });
      } else {
        return next(new ApiError(400, 'User already exists and is active.'));
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOTP();
    const otpCreatedAt = Date.now(); 
    console.log(otpCreatedAt);
    

   otpStore.set(email, { username, email, fullName, password: hashedPassword, otp, otpCreatedAt });

    const emailHtml = `
      <p>Dear ${fullName},</p>
      <p>Your OTP for account verification is:</p>
      <h2 style="color: #4CAF50;">${otp}</h2>
      <p>Please use this OTP to verify your account.</p>
    `;

    await sendEmail(email, 'Account Verification OTP', emailHtml);

    res.status(201).json({ message: 'OTP sent to your email. Please verify to complete registration.' });
  } catch (error) {
    console.error('Error during user registration:', error);
    next(new ApiError(500, 'An error occurred while registering the user.'));
  }
};


const verifyOTP = async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new ApiError(400, 'Email and OTP are required'));
  }

  try {
    const storedData = otpStore.get(email);

    if (!storedData) {
      return next(new ApiError(400, 'No OTP found for this email'));
    }

    const currentTime = Date.now();
    const otpAge = (currentTime - storedData.otpCreatedAt) / 1000;

    if (otpAge > 40) {
      otpStore.delete(email);
      return next(new ApiError(400, 'OTP has expired. Please request a new one.'));
    }

    if (storedData.otp !== otp) {
      return next(new ApiError(400, 'Invalid OTP.'));
    }

    const newUser = new User({
      username: storedData.username,
      email: storedData.email,
      fullName: storedData.fullName,
      password: storedData.password,
      status: 'Active'
    });

    await newUser.save();

    otpStore.delete(email);

    res.status(200).json({ message: 'User registered and verified successfully.', newUser });
  } catch (error) {
    console.error('Error during OTP verification:', error);
    next(new ApiError(500, 'An error occurred while verifying the OTP.'));
  }
};


const loginUser = async (req, res, next) => {   
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ApiError(400, 'Email and password are required'));
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(new ApiError(401, 'Invalid password'));
    }

    if (user.status !== 'Active') {
      return next(new ApiError(403, 'User account is not active'));
    }

    const { accessToken, refreshToken } = generateToken(user);
    user.refreshToken = refreshToken;

    user.loginDate = new Date();

    await user.save();

    res.status(200).json({ message: 'Login successful', user, accessToken });
  } catch (error) {
    console.error('Login Error:', error);
    next(new ApiError(500, 'An error occurred while logging in'));
  }

};



      const findAllUsers = async (req, res, next) => {
        try {
          const users = await User.find({});
          res.status(200).json(users);
        } catch (error) {
          return next(new ApiError(500, 'An error occurred while retrieving users'));
        }
      };

      const deactivateUser = async (req, res, next) => {
        const { userId } = req.params;

        try {
          const user = await User.findById(userId);
          
          

          if (!user) {
            return next(new ApiError(404, 'User not found'));
          }

          user.status = 'Pending';
          user.refreshToken = null;
          
          await user.save();

          res.status(200).json({ message: 'User deactivate successfully' });
        } catch (error) {
          next(new ApiError(500, 'An error occurred while updating the user status'));
        }
      };
      const updateUser = async (req, res, next) => {
        const { userId } = req.params;
        const { username, fullName, email } = req.body;
      
        if (!username && !fullName && !email) {
          return next(new ApiError(400, 'At least one field is required.'));
        }
      
        try {
          const user = await User.findById(userId);
      
          if (!user) {
            return next(new ApiError(404, 'User not found.'));
          }
      
          if (user.status !== 'Active') {
            return next(new ApiError(400, 'User is not active.'));
          }
      
          if (username) user.username = username;
          if (fullName) user.fullName = fullName;
          if (email) user.email = email;
      
          await user.save();
      
          res.status(200).json({ message: 'User updated successfully', user });
        } catch (error) {
          next(new ApiError(500, 'An error occurred while updating the user.'));
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
          next(new ApiError(500, 'An error occurred while refreshing the access token'));
        }
      };

      const deleteUser = async (req, res, next) => {
        const { userId } = req.params;
        try {
          const user = await User.findByIdAndDelete(userId);

          if (!user) {
            return next(new ApiError(404, 'User not found'));
          }

          res.status(200).json({ message: 'User deleted successfully' });
        } catch (error) {
          next(new ApiError(500, 'An error occurred while deleting the user'));
        }
      };


      const findUserId = async (req , res , next) => {
        const {userId} = req.params;
        try {
          const user = await User.findById(userId)
      if (!user) {
        return next(new ApiError(404 , "User not found"))
      }

      res.status(200).json({ message : 'User fetch successfully', user})


        } catch (error) {
          next(new ApiError(500, "An error occurred while retrieving the user"))
        }
      }


    
      


      export default {
        registerUser,
        findAllUsers,
        deactivateUser,
        updateUser,
        refreshAccessToken,
        deleteUser,
        loginUser,
        findUserId,
        verifyOTP,
      };

