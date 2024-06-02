// import environmental variables as early as possible in the application to make sure that the application behaves as expected
// require("dotenv").config({ path: "./env" });
import dotenv from "dotenv";
// import mongoose from "mongoose";
// import { DB_NAME } from "./constant";
// import app from "./app";
import connectDB from "./db/db.js";
dotenv.config({ path: "./env" });

//connect to the database
connectDB();

/*
//use of IFFE to avoid global variables, start the server and connect to the database
(async () => {
  try {
    //connect to the database
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    //error handling for the server connection
    app.on("error", (error) => {
      console.log(`Error: ${error}`);
      process.exit(1);
    });
    //start the server
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  } catch (error) {
    //error handling for the database connection
    console.error(`Error: ${error}`);
    process.exit(1);
  }
})();
*/
