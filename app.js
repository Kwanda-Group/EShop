import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

const app = express();

//setup dotenv and url parser
dotenv.config();

app.use(express.json());
app.use(cors());
const port = process.env.PORT;

// handle the connection to mongo db
(async function mongo_conn() {
  try {
    const mongo_url = process.env.MONGO_URL ;
    if(!mongo_url){
      console.log("Mongo url is invalid or missing");
      return;
    }
    await mongoose.connect(mongo_url)
    console.log("connected to mongo...");
  } catch (error) {
    console.error(`Failed to connect to mongo db :${error.message}`);
  } 
})()


// start the app
app.listen(port , ()=> console.log("Listening on port 5000..."));

export default app;