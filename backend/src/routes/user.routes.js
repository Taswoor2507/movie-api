import express from 'express';
import userController from '../controllers/user.controller.js';

const router = express.Router();

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.get('/verify/:userId', userController.verifyUser);
router.post('/activate/:userId', userController.activateUser);
router.get('/all', userController.findAllUsers);
router.delete('/:userId', userController.deleteUser) ;
router.put('/:userId', userController.updateUser);
router.post('/refresh-token', userController.refreshAccessToken);
router.get('/:userId', userController.findUserId)
// router.delete('/:userIddjhcb', userController.removeUser);

export default router;
    