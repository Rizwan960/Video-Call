const express = require('express');
const router = express.Router();
const homeController = require('../controllers/home')
const isAuth = require('../middleware/is-auth')
const { check, body } = require('express-validator')




router.get('/',isAuth, homeController.getHome),

router.post('/logout',isAuth,homeController.postLogout),

router.get('/update-password',isAuth,homeController.getUpdatePassword),

 router.post('/update-password',isAuth,[ body('newPassword')
    .isStrongPassword()
    .withMessage('Password should be minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1.').trim(),
    body('confirmPassword')
    .custom((value, { req }) => {
    if (value !== req.body.newPassword) {
        throw new Error('Confirm password did not match');
    }
    return true;
    }),],homeController.postUpdatePassword)


router.post('/room',isAuth, homeController.startRoomCall),

router.get('/room/:roomId',isAuth, homeController.joinRoom),



module.exports = router;