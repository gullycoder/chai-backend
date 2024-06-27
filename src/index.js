// import environmental variables as early as possible in the application to make sure that the application behaves as expected
// require("dotenv").config({ path: "./env" });
import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/db.js";

// load environmental variables from .env file
dotenv.config({ path: "./.env" });

const startServer = async () => {
  try {
    await connectDB();
    console.log("Connected to the database");

    // Error handling for the server connection
    app.on("error", (error) => {
      console.error(`Error Connecting the Server: ${error}`);
      process.exit(1);
    });

    const PORT = process.env.PORT || 3000;

    // Check if port is in use or if permissions are required
    //The app.listen method is used to bind and listen for connections on a specified port.
    //It effectively starts the server and begins accepting requests.
    app
      .listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      })
      .on("error", (err) => {
        if (err.code === "EACCES") {
          console.error(
            `Permission denied. You need elevated privileges to bind to port ${PORT}.`
          );
          process.exit(1);
        } else if (err.code === "EADDRINUSE") {
          console.error(`Port ${PORT} is already in use.`);
          process.exit(1);
        } else {
          console.error(`Server error: ${err}`);
          process.exit(1);
        }
      });
  } catch (error) {
    console.error(`Error Connecting to Database: ${error}`);
    process.exit(1);
  }
};

// Start the server
startServer();

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
