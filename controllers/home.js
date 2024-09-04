const User = require('../models/user')
const Room = require('../models/room')
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
    try{
        const room =await Room.findOne({adminEmail:req.session.user.email});
        console.log(room)
        if(room)
        {
            const error = new Error("You cannot create more then one call at same time");
            error.httpStatusCode=500;
            return next(error); 
        }else{
            const room = new Room({
                roomId : uuid,
                adminName : req.session.user.fullName,
                adminEmail : req.session.user.email,
                isEnded: false,
                inCall : true,
                roomUsers : {
                    users : []
                }
            })

           await room.save();
           return res.render('room/room', {
                path: '/room',
                pageTitle: 'Call Room',
                roomId: uuid
            })
        }
    }
    catch(err){
        const error = new Error(err);
        error.httpStatusCode=500;
        return next(error); 
    
    }
}

exports.joinRoom = async (req, res, next) => {
    const id = req.params.roomId;
    try {
      const room = await Room.findOne({ roomId: id });
      if (!room) {
        const error = new Error("Call does not exist.");
        error.httpStatusCode = 404;
        return next(error);
      }
      // Check if the user is the admin of the room trying to join
      if (room.adminEmail === req.session.user.email) {
        const error = new Error("You cannot join your own call.");
        error.httpStatusCode = 400;
        return next(error);
      }
      // Check if the room has ended
      if (room.isEnded) {
        const error = new Error("This call has already ended.");
        error.httpStatusCode = 400;
        return next(error);
      }
      // Update room with the new user
      const existingUser = room.roomUsers.users.find(
        (user) => user.userId.toString() === req.session.user._id.toString()
      );
      if (!existingUser) {
        room.roomUsers.users.push({
          userId: req.session.user._id,
          userName: req.session.user.fullName,
        });
        await room.save();
      }
      // Render the room view with updated room data
      res.render('room/room', {
        path: '/room',
        pageTitle: 'Call Room',
        roomId: id,
      });
    } catch (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  };
  
