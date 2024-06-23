import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      localStorage: true,
      trim: true, //removes whitespace from both ends of a string
      index: true, //index the field for faster search
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    //for avatar, we will store the URL of the image in the database of cloudinary or any other image hosting service
    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

//pre-save middleware to hash the password before saving it to the database
//in this we do not use arrow function because we need to access the user object, which is not available in arrow function
//arrow function does not have its own this, it uses the this value of the enclosing execution context
userSchema.pre("save", async function (next) {
  //if the password is not modified, skip this middleware
  if (!this.isModified("password")) {
    next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

//method to compare the password entered by the user with the hashed password in the database and return
//a boolean value if the password is correct
//This part of the code accesses the methods property of the userSchema.
//The methods property allows one to define instance methods that can be called on individual user documents (instances of the User model).
//These methods have access to the document's data through the this keyword.
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//method to generate a access token for the user to authenticate the user for protected routes and resources in the application and to keep the user logged in after the user logs in
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      userName: this.userName,
      email: this.email,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

//method to generate a refresh token for the user to keep the user logged in after the access token expires or the user logs out and logs in again without entering the password
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

const User = mongoose.model("User", userSchema);

export { User };
