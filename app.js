const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const crypto = require('crypto');
const secret = crypto.randomBytes(32).toString('hex');
const MONGODB_URI = 'mongodb+srv://rizwanali96960:11223344@cluster0.majjl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const http = require('http');
const csrf = require('csurf')
const {ExpressPeerServer} = require('peer')




// const multer = require('multer')
// const fileStorage = multer.diskStorage({
//   destination :(req,file,cb)=>{
//       cb(null,'images')
//   },
//   filename:(req,file,cb)=>{
//       cb(null,new Date().toISOString()+'-'+ file.originalname)
//   },
// })

// const fileFilter = (req,file,cb)=>{
//   if(file.mimetype==='image/png' || file.mimetype==='image/jpg' || file.mimetype==='image/jpeg')
//   {
//   cb(null,true)
//   }
//   else{
//   cb(null,false)
//   }
// }


// 1-Define controllers imports and Models
const errorController = require('./controllers/error');
const User = require ('./models/user')

// 2- Copre import like express Store
const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});
const csrfProtection = csrf()  
app.set('view engine', 'ejs');
app.set('views', 'views');

// 3- Routes Imports in same order
const authRoutes = require('./routes/auth');
const homeRoutes = require('./routes/home');
const flash = require('connect-flash/lib/flash');
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(multer({storage:fileStorage, fileFilter:fileFilter}).single('imageUrl'));
app.use(express.static(path.join(__dirname, 'public')));
// app.use('/images',express.static(path.join(__dirname, 'images')));


app.use(session({
  secret: secret,
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie : {
    maxAge: 1000 * 60 * 60 * 24 * 1
  }
}));
app.use(csrfProtection)
app.use(flash())
app.use((req,res,next)=>{
  res.locals.isAuthenticated=req.session.isLoggedIn;
  res.locals.csrfToken=req.csrfToken();
  next();
})
app.use((req,res,next)=>{
  if(!req.session.user)
  {
  return next();
  }
  User.findById(req.session.user)
  .then(user=>{
      if(!user)
      {
          return next();
      }
    req.user=user;
    next()
  })
  .catch(err=>{
    next(new Error(err))
  })
})



// Use authentication routes
app.use(authRoutes);
app.use(homeRoutes);
app.use(errorController.get404);
app.use(errorController.get500);
app.use((err, req, res, next) => {
    res.status(err.httpStatusCode || 500);
    res.render('500', {
        statusCode: err.httpStatusCode || 500,
        message: err.message || 'Something went wrong!'
    });
});



// Create HTTP server
const server = http.createServer(app);
const io = require('socket.io')(server)
// Integrate Peer server with the existing HTTP server
const peerServer = ExpressPeerServer(server, {
  debug: true
});

app.use('/peerjs', peerServer);

io.on('connection',(socket)=>{
  socket.on('join-room',(roomId,userId)=>{
    socket.join(roomId);
    setTimeout(()=>{
      socket.io(roomId).broadcast.emit('user-connected',userId)

    },1000)
  })
})

mongoose
  .connect(MONGODB_URI)
  .then(result => {
    server.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  })
  .catch(err => console.log(err));
