import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

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
    //save the refresh token in the user object
    user.refreshToken = refreshToken;
    //save the refresh token in the database
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

const refreshAccessAndRefreshToken = asyncHandler(async (req, res) => {
  //step 1: get the refresh token from the request cookie or body
  const refreshTokenReceivedFromClient =
    req.cookies.refreshToken || req.body.refreshToken; //for mobile app req.body will be used
  //step 2: check if the refresh token is available or not
  if (!refreshTokenReceivedFromClient) {
    throw new ApiError(401, "Unauthorized");
  }
  //step 3: verify the refresh token
  const decodedToken = jwt.verify(
    refreshTokenReceivedFromClient,
    process.env.REFRESH_TOKEN_SECRET
  );
  //step 4: get the user by id from the refresh token
  const user = await User.findById(decodedToken?._id);
  if (!user) {
    throw new ApiError(401, "Invalid Refresh Token");
  }
  //step 4.1: check if the user has the same refresh token in the database
  if (user?.refreshToken !== refreshTokenReceivedFromClient) {
    throw new ApiError(401, "Refresh token is expired");
  }
  //step 5: generate the new access token and refresh token
  const options = {
    httpOnly: true,
    secure: true,
  };
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  //step 6: send the new access token and refresh token to the client
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
          refreshToken,
        },
        "Access Token refreshed successfully"
      )
    );
});

//change password
const changePassword = asyncHandler(async (req, res) => {
  //step 1: get the user data from the request body from the client side or frontend
  const { currentPassword, newPassword } = req.body;
  //step 2: check if the current password and new password is provided or not
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password is required");
  }
  //step 3: check if the current password is correct or not
  const user = await User.findById(req.user._id);
  const isPasswordMatch = await user.comparePassword(currentPassword);
  if (!isPasswordMatch) {
    throw new ApiError(401, "Invalid current password");
  }
  //step 4: update the user password with the new password
  user.password = newPassword;
  await user.save({
    validateBeforeSave: false,
  });
  //step 5: send the success response to the client
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

//get current user end point
const getCurrentUser = asyncHandler(async (req, res) => {
  // step 1: get the user object from the request object
  const user = req.user;
  // step 2: send the user object in the response
  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "Current User details fetched successfully")
    );
});

// update user profile

const updateUserProfile = asyncHandler(async (req, res) => {
  //step 1: get the user data from the request body from the client side or frontend
  const { fullName, email } = req.body; //we can also update the username, avatar, coverImage
  //production level advice: keep the file update separate end point and use multer middleware to handle the file data
});
//step 2: check if the details are provided or not
if (!fullName || !email) {
  throw new ApiError(400, "Full name and email is required");
}
//step 3: check if the email is already taken by another user or not

const user = await User.findOne({
  email: email,
  _id: { $ne: req.user._id },
});
// step 4: check if the user is already exists in the database or not
if (user) {
  throw new ApiError(409, "Email is already taken");
}

//step 5: update the user object with the new data
const updatedUser = await User.findByIdAndUpdate(
  req.user._id,
  {
    $set: {
      fullName,
      email,
    },
  },
  { new: true }
).select("-password -refreshToken");

//step 6: send the updated user object in the response
return res
  .status(200)
  .json(new ApiResponse(200, updatedUser, "User profile updated successfully"));

//update Avatar
const updateAvatar = asyncHandler(async (req, res) => {
  //step 1: check if the avatar image is available or not
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }
  //step 2: upload the image to the cloudinary server
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  //step 3: check the image is uploaded successfully or not and get the image URL from the cloudinary server
  if (!avatar.url) {
    throw new ApiError(400, "Failed to upload avtar image on cloudinary");
  }
  //step 4: update the user object with the new avatar image URL
  const updated = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken"); //select method is used to remove the password and refresh token from the user object
  //step 5: send the updated user object in the response
  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Avatar updated successfully"));
});

//update cover image

const updateCoverImage = asyncHandler(async (req, res) => {
  //step 1: check if the cover image is available or not
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image is required");
  }
  //step 2: upload the image to the cloudinary server
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  //step 3: check the image is uploaded successfully or not and get the image URL from the cloudinary server
  if (!coverImage.url) {
    throw new ApiError(400, "Failed to upload cover image on cloudinary");
  }
  //step 4: update the user object with the new cover image URL
  const updated = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken"); //select method is used to remove the password and refresh token from the user object
  //step 5: send the updated user object in the response
  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Cover Image updated successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessAndRefreshToken,
  changePassword,
  getCurrentUser,
  updateUserProfile,
  updateAvatar,
  updateCoverImage,
};
