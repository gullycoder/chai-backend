import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.route("/register").post(
    //upload middleware is injected to handle the file data
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    //registerUser is the controller function to handle the request
    registerUser);

export default router;