import express from 'express';
import userController from '../controllers/user.controller.js';

const router = express.Router();

router.post('/register', userController.registerUser);
router.get('/verify/:userId', userController.verifyUser);
router.post('/activate/:userId', userController.activateUser);
router.get('/all', userController.findAllUsers);
router.delete('/:userId', userController.deleteUser);

export default router;
