const User = require('../models/user')
const bcrypt  = require('bcryptjs')
const { validationResult } = require('express-validator')

// const nodemailer = require('nodemailer')
// const sendgrindTransport = require('nodemailer-sendgrid-transport')
// const transport = nodemailer.createTransport(sendgrindTransport({
//     auth:{
//         api_key:"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",
//     }
// }))


exports.getLogin = async (req, res, next)=> {
    let message=req.flash('error');
    if(message.length>0)
    {
        message=message[0]
    }else{
    message=null
    }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: message,
        oldInput : {
            email:'',
        },
    })
}

exports.getSignup = async (req, res, next)=> {
    let message=req.flash('error');
    if(message.length>0)
    {
        message=message[0]
    }else{
    message=null
    }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: message,
        oldInput : {
            fullName:'',
            email:'',
        },
        validationErros:[]
    })
}

exports.postSignup = async (req, res, next)=> {
    const {fullName, email, password} = req.body
    const errors = validationResult(req)
    if(!errors.isEmpty())
    {
        console.log(errors)
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            oldInput : {
                fullName:fullName,
                email:email,
                passowrd:'',
                confirmPassowrd:'',
            },
            validationErros:errors.array()
        });
    }
    try{
        const hashedPassword = await bcrypt.hash(password,12)
        const user = new User({
            fullName: fullName,
            email : email,
            password :hashedPassword
        })
        req.session.isLoggedIn = true;
        req.session.user = user;
        await user.save();
        res.redirect('/');
    }
    catch (e){
        const error = new Error(e);
        error.httpStatusCode=500;
        return next(error); 
    }
}

exports.postLogin = async (req, res, next)=>{
   
    const {email, password} = req.body
    const errors = validationResult(req)
    if(!errors.isEmpty())
    { 
        console.log(errors)
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            oldInput : {
                email:email,
                passowrd:'',
            },
            validationErros:errors.array()
        });
    }
    try{
        const user =await User.findOne({email : email});
        if (!user) {
            // If user is not found
            req.flash('error','No user found with this email')
            return res.redirect('/login'); 
        }
        const doMatch = await bcrypt.compare(password, user.password);
        if(doMatch)
        {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
            res.redirect('/');
            });
        }
        req.flash('error','Invalid email or password.')
        res.redirect('/login'); // Or handle error as needed

    }
    catch(err){
    
        const error = new Error(err);
        error.httpStatusCode=500;
        return next(error); 
    }
}

