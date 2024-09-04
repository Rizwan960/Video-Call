const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const roomSchema = new Schema({
roomId: {
    type:String,
    required:true,
},
adminName: {
    type:String,
    required:true,
},
adminEmail: {
    type:String,
    required:true,
},
roomUsers:{
    users : [
        {
            userId:{
                type: Schema.Types.ObjectId,
                required: true,
                ref: 'User'
              },
              userName: {
                type: Schema.Types.String,
                required: true,
                ref: 'User'
              }
        }
    ]
},

});

module.exports=mongoose.model('Room',roomSchema);