import mongoose from "mongoose";

const UsersSchema = new mongoose.Schema({
    name:{type:String , required:true},
    email:{type:String , required:true},
    phone:{type:String , required:true},
    password:{type:String , required:true},
    createdAt:{type:Date, default:Date.now}
});

// mongoose model
const UserModel = mongoose.model("Users" , UsersSchema);

export default UserModel;