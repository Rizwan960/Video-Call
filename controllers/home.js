const User = require('../models/user')
const bcrypt  = require('bcryptjs')
const crypto = require('crypto');
const { validationResult } = require('express-validator')

exports.getHome = async (req, res, next)=> {
    res.render('home/index', {
        path: '/',
        pageTitle: 'Home',
    })
}

exports.getUpdatePassword = async (req, res, next)=> {
    res.render('home/uppassword', {
        path: '/update-password',
        pageTitle: 'Update Password',
    })
}

exports.postUpdatePassword = async (req, res, next)=> {
    const {currentPassword, newPassword,confirmPassword} = req.body
    const errors = validationResult(req)
    if(!errors.isEmpty())
    { 
        console.log(errors)
        return res.status(422).render('home/uppassword', {
            path: '/update-password',
            pageTitle: 'Update Password',
            errorMessage: errors.array()[0].msg,
            validationErros:errors.array()
        });
    }
    try{
        console.log(req.session.user.password)
        console.log(currentPassword)
        const  doMatch=  await bcrypt.compare(currentPassword,req.session.user.password,);
        if(!doMatch)
        {
            console.log("2")
        req.flash('error','Incorrect Current Password')
        return res.redirect('/update-password'); // Or handle error as needed
        }
        const newHassedPassword = await bcrypt.hash(newPassword,12);
        const user = await User.findOne({email : req.session.user.email})
        if(!user)
        {
            console.log("1")
            req.flash('error','User not found')
            return res.redirect('/update-password'); // Or handle error as needed
        }else {
        req.session.user.password=newHassedPassword
        user.password = newHassedPassword;
        await user.save();
        req.flash('success', 'Password updated successfully');
        res.redirect('/');
        }
    }
    catch(err){
        const error = new Error(err);
        error.httpStatusCode=500;
        return next(error); 
    }
}

exports.postLogout = async (req,res,next)=>{
    req.session.destroy(()=>{
        res.redirect('/')
        });
}

exports.startRoomCall = async (req, res, next)=> {
    const uuid = crypto.randomUUID();
    res.render('room/room', {
        path: '/room',
        pageTitle: 'Call Room',
        roomId: uuid
    })
}

exports.joinRoom = async (req, res, next)=> {
    res.render('room/room', {
        path: '/room',
        pageTitle: 'Call Room',
        roomId: uuid
    })
}
