import mongoose from "mongoose";
//import the database name from the constant file and use .js extension to avoid the error "Cannot use import statement outside a module
import { DB_NAME } from "../constant.js";
//connect to the database
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(`MongoDB connected: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Failed: ${error}`);
    process.exit(1); //exit with failure
  }
};

export default connectDB;
