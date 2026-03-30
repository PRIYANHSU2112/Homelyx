const { Credentials } = require("aws-sdk");
const S3 = require("aws-sdk/clients/s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
const createError = require("http-errors");

const s3Client = new S3({
  region: process.env.LINODE_OBJECT_STORAGE_REGION || "sgp1",
  endpoint:
    process.env.LINODE_OBJECT_STORAGE_ENDPOINT ||
    "https://sgp1.digitaloceanspaces.com",
  sslEnabled: true,
  s3ForcePathStyle: false,
  credentials: new Credentials({
    accessKeyId:
      process.env.LINODE_OBJECT_STORAGE_ACCESS_KEY_ID || "DO00Z942D6M3HUV48DCM",
    secretAccessKey:"psMqLH/f+54S/fiZwewr2IM/ah8f8K+O5PzVjU8mCyw",
  }),
});
// Function to filter file uploads
function multerFilter(req, file, cb) {
  // Check if the file is in JPEG or PNG format
  console.log(file.mimetype)
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png"  ||
    file.mimetype === "video/mp4" || 
    file.mimetype === "image/gif"||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true); // Accept the file
  } else {
    const error = new Error("Only JPEG, JPG, or PNG formats allowed!");
    error.status = 400; // You can set the status code as needed
    cb(error, false); // Reject the file with an error
  }
}

// Configure multer for file uploads
// exports.upload = multer({
//   storage: multerS3({
//     s3: s3Client,
//     acl: "public-read",
//     cket: "satyakabirbucket",
//     contentType: function (req, file, cb) {
//       cb(null, file.mimetype);
//     },
//     onError: function (err, next) {
//        console.log('dkkddj')
//       // Check if the error is related to image validation
//       if (err && err.message === "Only JPEG, JPG, or PNG formats allowed!") {
//         console.log(err)
//         // This is an image validation error, so you can throw a custom error
//         const imageValidationError = new Error("Image validation failed");
//         imageValidationError.status = 400; // Set the appropriate status code
//         next(imageValidationError); // Pass the custom error to the next middleware
//       } else {
//         // Handle other types of errors as needed
//         console.error("Error during file upload:", err);
//         next(err);
//       }
//     },
//     key: function (req, file, cb) {
//       cb(
//         null,
//         process.env.BUCKET_FOLDER_PATH +
//           Date.now().toString() +
//           file.originalname
//       );
//     },
//   }),
// });

exports.upload = multer({
  storage: multerS3({
    s3: s3Client,
    acl: "public-read",
    bucket: "satyakabir-bucket",
    contentType: function (req, files, cb) {
      cb(null, files.mimetype);
    },
    // onError: function (err, next) {
    //   console.log("error", err);
    //   next(err);
    // },
    metadata: function (req, file, cb) {
      multerFilter(req, file, function (error, isValid) {
        if (error) {
          // console.log("dhddddddd")
          // console.log(error)
          // req.test = error
          //  next()
          req.fileValidationError = error.message;
        }
        cb(null, { fieldName: file.fieldname });
      });
    },
    key: function (req, file, cb) {
      cb(
        null,
        process.env.BUCKET_FOLDER_PATH +
          Date.now().toString() +
          file.originalname
      );
    },
  }),
});

exports.imageValidetion = (req, res, next) => {
  try {
    if (req.fileValidationError) {
      return res
        .status(400)
        .json({ success: false, message: req.fileValidationError });
    } else {
      next();
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteFileFromObjectStorage = (path) => {
  // const Key = url.split(`${process.env.LINODE_OBJECT_STORAGE_ENDPOINT}/`)[1];
  const Key = path;

  const params = {
    Bucket: process.env.LINODE_OBJECT_BUCKET,
    Key,
  };

  // // see: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObject-property
  // // eslint-disable-next-line consistent-return
  console.log(s3Client.deleteObject(params).promise());
};
