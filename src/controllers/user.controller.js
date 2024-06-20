import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // code to register a user
  //step 1: get the user data from the request body from the client side or frontend
  const { fullName, userName, email, password } = req.body;
  // step 2: validate the user data to ensure that the user has provided all the required data

  if (
    [fullName, userName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  //step 3: check if the user already exists in the database

  const existedUser = await User.findOne({
    //use of operator using $or and check all the values in an array

    $or: [{ userName: userName }, { email: email }],
  });
  if (existedUser) {
    console.log("existedUser", existedUser);
    throw new ApiError(409, "User already exists");
  }
  //step 4: check avtar image is available or not and user image is valid or not

  const avtarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  console.log(avtarLocalPath);
  if (!avtarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  //step 5: upload the image to the cloudinary server

  const avatar = await uploadOnCloudinary(avtarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  //step 6: check the image is uploaded successfully or not and get the image URL from the cloudinary server
  if (!avatar) {
    throw new ApiError(400, "Failed to upload image");
  }

  //step 7: create object with the user data and image URL to save in the database-create entry in db/db call
  const user = await User.create({
    fullName,
    userName: userName.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  //step 8: check the user object is created successfully or not i.e. not the null response & remove password and sensitive data from the user object received in reponse

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }

  //step 9: send the success response to the client with the user object
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
  //here we can only handel jason data, so we need to use multer middleware to handle the file data

  //checking  if different fields are empty or not,use some method
});

export { registerUser };
