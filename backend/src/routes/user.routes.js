import express from 'express';
import userController from '../controllers/user.controller.js';

const router = express.Router();

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/verify-otp', userController.verifyOTP);
router.get('/all', userController.findAllUsers);
router.delete('/:userId', userController.deactivateUser) ;
router.put('/update/:userId', userController.updateUser);
router.post('/refresh-token', userController.refreshAccessToken);
router.get('/:userId', userController.findUserId)
router.delete('/delete/:userId', userController.deleteUser);

export default router;
    