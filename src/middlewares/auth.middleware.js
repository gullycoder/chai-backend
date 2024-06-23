import { asyncHandler } from "../utils/asynchandler";
import { ApiError } from "../utils/ApiError";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";

// Desc: Middleware to verify JWT token
//middleware is a function that has access to the request and response objects and the next function in the application's request-response cycle.
//objective of middleware : simply to execute some code before the actual route handler is executed.
const verifyJWT = async (req, res, next) => {
  // const verifyJWT = async (req, _, next) => {}, some timed when we do not need to use the response object, we can use _ instead of res
  //get the token from the request header or authorization header or from the cookie
  // const token = req.headers["authorization"];
  const token =
    req.cookies?.accessToken ||
    req.headers("Authorization")?.replace("Bearer ", "") ||
    req.headers["authorization"];

  //if the token is not available in the request header, return an error response
  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    //verify the token using the secret key
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    //find the user in the database using the user id from the token
    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );
    //if the token is valid, attach the user object to the request object
    req.user = user;
    //execute the next middleware or route handler
    next();
  } catch (error) {
    //if the token is invalid, return an error response
    throw new ApiError(401, "Unauthorized request");
  }
};

export { verifyJWT };
