import multer from "multer";
//file handling we need to install the multer package, which is a middleware for handling multipart/form-data, which is primarily used for uploading files.
//using multer to upload files to the server also using the disk storage engine to store the files in the /tmp/my-uploads folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});
const upload = multer({ storage: storage });

export { upload };
