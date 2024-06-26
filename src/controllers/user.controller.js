import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

//we will use access and refresh token multipletime in the application, so we will create a separate function to generate the token
const generateAccessAndRefreshToken = async (userId) => {
  try {
    if (!process.env.ACCESS_TOKEN_SECRET || !process.env.ACCESS_TOKEN_EXPIRY) {
      throw new Error(
        "Missing environment variables for access token generation."
      );
    }

    if (
      !process.env.REFRESH_TOKEN_SECRET ||
      !process.env.REFRESH_TOKEN_EXPIRY
    ) {
      throw new Error(
        "Missing environment variables for refresh token generation."
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: false,
    });
    return { accessToken, refreshToken };
  } catch (error) {
    console.log("error", error);
    throw new ApiError(500, "Failed to generate tokens");
  }
};

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

//create login user controller function
const loginUser = asyncHandler(async (req, res) => {
  //step 1: get the user data from the request body from the client side or frontend
  const { email, userName, password } = req.body;
  //step 2: validate the user data to ensure that the user has provided all the required data
  if (!(email || userName)) {
    throw new ApiError(400, "Email or username is required");
  }
  // if (![email, userName, password].some((field) => field?.trim() === "")) {
  //   throw new ApiError(400, "All fields are required");
  // }
  //step 3: check if the user already exists in the database or find the user by email or username
  const user = await User.findOne({
    $or: [{ email: email }, { userName: userName }],
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  //step 4: check the user password is correct or not
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw new ApiError(401, "Invalid password");
  }
  //step 5: generate the access token and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  //step 6: send the token to the client in cookie or header and send the user object in the response
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      secure: true,
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      secure: true,
    })
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

//create logout user controller function

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );
  return res
    .status(200)
    .clearCookie("accessToken", { httpOnly: true, secure: true })
    .clearCookie("refreshToken", { httpOnly: true, secure: true })
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export { registerUser, loginUser, logoutUser };
