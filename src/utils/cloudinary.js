import { v2 } from "cloudinary";
import fs from "fs";

const cloudinary = v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload file on Cloudinary and return the URL of the uploaded file
const uploadOnCloudinary = async (localfilepath) => {
  try {
    if (!localfilepath) return null;
    // Upload file on Cloudinary
    const result = await cloudinary.uploader.upload(localfilepath, {
      resource_type: "auto",
    });
    console.log("cloudinary response", result);
    //unlink the local file after uploading on cloudinary
    fs.unlinkSync(localfilepath); // remove the file from the server synchronously because only after removing want to proceed further
    return result;
  } catch (error) {
    //remove the local saved file on our server if it fails to upload on cloudinary
    fs.unlinkSync(localfilepath);
    return null;
    console.log(error);
  }
};

export { uploadOnCloudinary };
