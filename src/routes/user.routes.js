import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessAndRefreshToken,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.route("/register").post(
  //upload middleware is injected to handle the file data
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  //registerUser is the controller function to handle the request
  registerUser
);
router.route("/login").post(loginUser);
//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
//refreshtoken route to refresh the access token
router.route("/refreshToken").post(refreshAccessAndRefreshToken);

export default router;
