const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth')
const { check, body } = require('express-validator')
const User = require('../models/user')




router.post('/login', [   check('email', 'Enter a valid email')
    .isEmail()
    .notEmpty()
    .withMessage('Email should not be empty').normalizeEmail()
   ,
   check('password', 'Password should not be empty')
   .notEmpty().trim()
   
],authController.postLogin),

router.get('/login',authController.getLogin),


router.get('/signup',authController.getSignup),

router.post('/signup',
    [
        check('email') .isEmail()
        .withMessage('Enter a valid email').normalizeEmail()
        .custom(async (value) => {
        try {
            const userDoc = await User.findOne({ email: value });
            if (userDoc) {
            return Promise.reject('User already exists with this email');
            }
        } catch (err) {
            console.error(err);
            throw new Error('Server error while checking email');
        }
        }),
        body('fullName')
        .trim()
            .isLength({ min: 3 })
            .withMessage('Name must be at least 3 characters long'),
        body('password')
        .isStrongPassword()
        .withMessage('Password should be minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1.').trim(),
        body('confirmPassword')
        .custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Confirm password did not match');
        }
        return true;
        }),
    ], 
authController.postSignup
),





module.exports = router;