import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//using the cookie parser middleware to parse the cookies from the request
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    // origin: "*",
    // methods: ["GET", "POST", "PUT", "DELETE"],
    // allowedHeaders: ["Content-Type", "Authorization"],
  })
);

//getting jason data from the request body and limiting the size of the request body to 16kb
app.use(
  express.json({
    limit: "16kb",
  })
);
// getting url encoded data from the request body and limiting the size of the request body to 16kb
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// creating a static file server to serve the files in the public directory
app.use(express.static("public"));

//mostly routes will add in app.js file so that we can see all the routes at one place
//importing the user routes here and using it in the app
import userRoutes from "./routes/user.routes.js";

//routes declaration for the user routes and using the userRoutes, why not using app.get???
app.use("/api/v1/users", userRoutes); //http://localhost:3000/api/v1/users/register

export default app;
