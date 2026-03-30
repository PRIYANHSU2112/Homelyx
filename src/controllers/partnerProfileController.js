const partnerProfileModel = require("../models/partnerProfileModel");
const userModel = require("../models/userModel");
const {
  deleteFileFromObjectStorage,
} = require("../midellwares/multerMidellware");
const { partnerIdCard } = require("../midellwares/partnerProfileId");
const {
  idDocumentStatus,
  idDocumentType,
} = require("../helper/idDocumentStatus");

// ========================== Get Id =================================== ||

exports.getPartnerProfileId = async (req, res, next, id) => {
  try {
    let partnerProfile = await partnerProfileModel
      .findById(id)
      .populate("cityId userId");
    if (!partnerProfile) {
      return res.status(404).json({
        success: false,
        message: "partnerProfile Not Found",
      });
    } else {
      (req.partnerProfile = partnerProfile), next();
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========================== Create partnerProfile ================================== ||

exports.createPartnerProfile = async (req, res) => {
  try {
    let {
      address,
      pincode,
      longitude,
      latitude,
      addharNumber,
      userId,
      remark,
    } = req.body;
let selfie;
    let frontImage;
    let documents;
    let backImage;
    if (req.files && req.files.selfie) {
      selfie = req.files.selfie ? req.files.selfie[0].key : null;
    }
    if (req.files && req.files.documents) {
      documents = req.files.documents ? req.files.documents[0].key : null;
    }
    if (req.files && req.files.frontImage) {
      frontImage = req.files.frontImage ? req.files.frontImage[0].key : null;
    }
    if (req.files && req.files.backImage) {
      backImage = req.files.backImage ? req.files.backImage[0].key : null;
    }
    let check1 = await partnerProfileModel.findOne({ userId: userId });
    if (check1) {
      return res.status(400).json({
        success: false,
        message: "your partnerProfile already exist",
      });
    }
    if (!selfie) {
      return res.status(400).json({
        success: false,
        message: "selfie Is Required...",
      });
    }
    if (!frontImage) {
      return res.status(400).json({
        success: false,
        message: "frontImage Is Required...",
      });
    }
    if (!backImage) {
      return res.status(400).json({
        success: false,
        message: "backImage Is Required...",
      });
    }
    if (!addharNumber) {
      return res.status(400).json({
        success: false,
        message: "addharNumber Is Required...",
      });
    }
    if (!address) {
      return res.status(400).json({
        success: false,
        message: "address Is Required...",
      });
    }
    if (!pincode) {
      return res.status(400).json({
        success: false,
        message: "pincode Is Required...",
      });
    }
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId Is Required...",
      });
    }
    let check = await userModel.findById(userId);
    let obj = {};
    obj.backImage = backImage;
    obj.frontImage = frontImage;
    obj.addharNumber = addharNumber;
    let obj2 = {};
    obj2.image = selfie;

    let partnerProfile = await partnerProfileModel.create({
      name: check?.fullName,
      email: check?.email,
      phoneNumber: check?.phoneNumber,
      address: address,
      pincode: pincode,
      userId: userId,
      longitude: longitude,
      latitude: latitude,
      selfie: obj2,
      idDocument: obj,
      remark: remark,
		documents:documents
    });
    return res.status(201).json({
      success: true,
      message: "partnerProfile Is Created Successfully...",
      data: partnerProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateDocumentsPartnerProfile = async (req, res) => {
  try {
    let partnerProfile = req.partnerProfile;
    let documents;
    if (req.file) {
      documents = req.file ? req.file.key : null;
    }
    if (!documents) {
      return res.status(400).json({
        success: false,
        message: "documents Is Required...",
      });
    }
    if (documents != null && partnerProfile.documents != null) {
      deleteFileFromObjectStorage(partnerProfile.documents);
    }
    let updatepartnerProfile = await partnerProfileModel
      .findByIdAndUpdate(
        { _id: partnerProfile._id },
        {
          $set: {
            documents: documents,
          },
        },
        { new: true }
      )
      .populate("userId");
    return res.status(200).json({
      success: true,
      message: "partnerProfile documents Update Successfully...",
      data: updatepartnerProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
// ========================== Get By Id =================================== ||

exports.getBypartnerProfileByUserId = async (req, res) => {
  try {
    let check = await partnerProfileModel.findOne({
      userId: req.params.userId,
    });
    return res.status(200).json({
      success: true,
      message: "partnerProfile Fatch Successfully...",
      data: check,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBypartnerProfileId = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "partnerProfile Fatch Successfully...",
      data: req.partnerProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================== Get All ============================ ||

exports.getAllpartnerProfile = async (req, res) => {
  try {
    let { page, search, disable, orderPartner } = req.query;
    let a = null;
    if (search && search.length == 10 && !isNaN(Number(search))) {
      a = Number(search);
    }
    let query = {
      phoneNumber: { $nin: [null, undefined] },
    };
    if (a !== null && a !== undefined) {
      query.phoneNumber = a;
    }
    if (disable) {
      query.disable = disable;
    }
    let partnerProfile = await partnerProfileModel
      .find(query)
      .sort({ createdAt: -1 })
      .populate("cityId userId");
    if (search && a == null && a == undefined) {
      const regexSearch = new RegExp(search, "i");
      partnerProfile = partnerProfile.filter((e) => {
        return regexSearch.test(e?.name);
      });
    }
    if (orderPartner == "true") {
      for (let i = 0; i < partnerProfile.length; i++) {
        if (partnerProfile[i].userId != null) {
          partnerProfile[i]._doc.fullName = partnerProfile[i].userId.fullName;
          partnerProfile[i]._doc.userId = partnerProfile[i].userId._id;
        }
      }
    }
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;
    let length = partnerProfile.length;
    let count = Math.ceil(length / 20);
    let data = partnerProfile.slice(startIndex, endIndex);
    return res.status(200).json({
      success: true,
      message: "All partnerProfile Fatch Successfully...",
      data: data,
      page: count,
    });
    // }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
// ======================== Update partnerProfile ============================ ||

exports.updatePartnerProfile = async (req, res) => {
  try {
    let partnerProfile = req.partnerProfile;
    let {
      fullName,
      email,
      address,
      pincode,
      longitude,
      latitude,
      addharNumber,
      userId,
      remark,
    } = req.body;
       let selfie;
    let frontImage;
    let backImage;
    let documents;
    if (req.files && req.files.selfie) {
      selfie = req.files.selfie ? req.files.selfie[0].key : null;
    }
    if (req.files && req.files.documents) {
      documents = req.files.documents ? req.files.documents[0].key : null;
    }
    if (req.files && req.files.frontImage) {
      frontImage = req.files.frontImage ? req.files.frontImage[0].key : null;
    }
    if (req.files && req.files.backImage) {
      backImage = req.files.backImage ? req.files.backImage[0].key : null;
    }
    if (selfie && partnerProfile.selfie.image != null) {
      deleteFileFromObjectStorage(partnerProfile.selfie.image);
    }
    if (documents && partnerProfile.documents != null) {
      deleteFileFromObjectStorage(partnerProfile.documents);
    }
    if (frontImage && partnerProfile.idDocument.frontImage != null) {
      deleteFileFromObjectStorage(partnerProfile.idDocument.frontImage);
    }
    if (backImage && partnerProfile.idDocument.backImage != null) {
      deleteFileFromObjectStorage(partnerProfile.idDocument.backImage);
    }
    let check = await userModel.findById(userId);
    let obj = {};
    obj.backImage = backImage;
    obj.frontImage = frontImage;
    obj.addharNumber = addharNumber;
    obj.status = "PENDING";
    let obj2 = {};
    obj2.image = selfie;
    obj2.status = !userId ? "APPROVED" : "PENDING";
    let updatepartnerProfile = await partnerProfileModel
      .findOneAndUpdate(
        { _id: partnerProfile._id },
        {
          $set: {
            name: fullName
              ? fullName
              : check
              ? check.fullName
              : req.partnerProfile.name,
            email: email
              ? email
              : check
              ? check?.email
              : req.partnerProfile.email,
            phoneNumber: check
              ? check?.phoneNumber
              : req.partnerProfile.phoneNumber,
            address: address,
            pincode: pincode,
            userId: userId,
            longitude: longitude,
			  documents:documents,
            latitude: latitude,
            selfie: selfie ? obj2 : req.partnerProfile.selfie,
            idDocument:
              backImage && frontImage ? obj : req.partnerProfile.idDocument,
            remark: remark,
          },
        },
        { new: true }
      )
      .populate("userId");
    return res.status(200).json({
      success: true,
      message: "partnerProfile Update Successfully...",
      data: updatepartnerProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================== Delete partnerProfile ========================= ||

exports.deletepartnerProfile = async (req, res) => {
  try {
    let deletepartnerProfile = await partnerProfileModel.deleteOne({
      _id: req.partnerProfile._id,
    });
    return res.status(200).json({
      success: true,
      message: "partnerProfile Delete Successfully...",
      data: deletepartnerProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================ Disable partnerProfile ======================== ||

exports.disablepartnerProfile = async (req, res) => {
  try {
    let updatepartnerProfile = await partnerProfileModel.findByIdAndUpdate(
      { _id: req.partnerProfile._id },
      {
        $set: {
          disable: !req.partnerProfile.disable,
        },
      },
      { new: true }
    );
    if (updatepartnerProfile.disable == true) {
      return res.status(200).json({
        success: true,
        message: "partnerProfile Successfully Disable...",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "partnerProfile Successfully Enable...",
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== updateSelfiePartnerProfile ========================= ||

exports.updateSelfiePartnerProfile = async (req, res) => {
  try {
    let partnerProfile = req.partnerProfile;
    let selfie;
    if (req.file) {
      selfie = req.file ? req.file.key : null;
    }
    if (!selfie) {
      return res.status(400).json({
        success: false,
        message: "selfie Is Required...",
      });
    }
    if (selfie != null && partnerProfile.selfie.image != null) {
      deleteFileFromObjectStorage(partnerProfile.selfie.image);
    }
    let obj2 = {};
    obj2.image = selfie;
    obj2.status = "PENDING";
    let updatepartnerProfile = await partnerProfileModel
      .findByIdAndUpdate(
        { _id: partnerProfile._id },
        {
          $set: {
            selfie: obj2,
          },
        },
        { new: true }
      )
      .populate("userId");
    return res.status(200).json({
      success: true,
      message: "partnerProfile Selfie Update Successfully...",
      data: updatepartnerProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== updateDocumentPartnerProfile ========================= ||

exports.updateDocumentPartnerProfile = async (req, res) => {
  try {
    let partnerProfile = req.partnerProfile;
    let frontImage;
    let backImage;
    if (req.files && req.files.frontImage) {
      frontImage = req.files.frontImage ? req.files.frontImage[0].key : null;
    }
    if (req.files && req.files.backImage) {
      backImage = req.files.backImage ? req.files.backImage[0].key : null;
    }
    if (frontImage && partnerProfile.idDocument.frontImage != null) {
      deleteFileFromObjectStorage(partnerProfile.idDocument.frontImage);
    }
    if (backImage && partnerProfile.idDocument.backImage != null) {
      deleteFileFromObjectStorage(partnerProfile.idDocument.backImage);
    }
    if (!backImage || !frontImage || !req.body.addharNumber) {
      throw {
        status: 400,
        message: !backImage
          ? "backImage IS Required.."
          : !frontImage
          ? "frontImage Is Required..."
          : "addharNumber Is Required...",
      };
    }
    let obj = {};
    obj.backImage = backImage;
    obj.frontImage = frontImage;
    obj.addharNumber = req.body.addharNumber;
    obj.status = "PENDING";
    let updatepartnerProfile = await partnerProfileModel
      .findByIdAndUpdate(
        { _id: partnerProfile._id },
        {
          $set: {
            idDocument: obj,
          },
        },
        { new: true }
      )
      .populate("userId");
    return res.status(200).json({
      success: true,
      message: "partnerProfile Document Update Successfully...",
      data: updatepartnerProfile,
    });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ success: false, message: error.message });
  }
};

// ====================== updateDocumentPartnerProfile ========================= ||

exports.updateDocumentStatus = async (req, res) => {
  try {
    let partnerProfile = req.partnerProfile;
    if (
      (req.body.status &&
        !Object.values(idDocumentStatus).includes(req.body.status)) ||
      (req.body.selfieStatus &&
        !Object.values(idDocumentStatus).includes(req.body.selfieStatus))
    ) {
      throw {
        status: 400,
        message: "Please Provide Valied Status (REJECTED PENDING APPROVED)",
      };
    }
    const updatepartnerProfile = await partnerProfileModel
      .findByIdAndUpdate(
        { _id: partnerProfile._id },
        {
          $set: {
            "idDocument.status": req.body.status,
            "selfie.status": req.body.selfieStatus,
          },
        },
        { new: true }
      )
      .populate("cityId userId");
    return res.status(200).json({
      success: true,
      message: "partnerProfile Document Update Successfully...",
      data: updatepartnerProfile,
    });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ success: false, message: error.message });
  }
};

exports.IdCardGenrate = async (req, res) => {
  try {
    let code = await partnerIdCard(req.params.userId);
    console.log(req.params.userId);
    const updatepartnerProfile = await partnerProfileModel
      .findOneAndUpdate(
        { userId: req.params.userId },
        {
          $set: {
            idCard: `HomeService/${code}.pdf`,
          },
        },
        { new: true }
      )
      .populate("cityId userId");
    return res.status(200).json({
      success: true,
      message: "id Card Genrate",
      data: updatepartnerProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};




const fs = require('fs');
const AWS = require('aws-sdk');
// require('dotenv').config();

// Configure the AWS SDK with Linode Object Storage credentials

const s3 = new AWS.S3({
  accessKeyId: "ONX5GHG5U5421621M63F",
  secretAccessKey: "PRIwOYk72vYugYNfbqTI3pZkU36zNY0rEtxcIuzn",
  endpoint: "in-maa-1.linodeobjects.com", // or the appropriate endpoint for your region
  s3ForcePathStyle: true, // Required for Linode Object Storage
  signatureVersion: 'v4'
});

exports.imageDownload = (req, res) => {

console.log("ghit")
	const {imagePath} = req.query

const bucketName = 'leadkart';
const objectKey = imagePath // Change to the path of your image in the bucket
const downloadPath = './image.jpg';

// const bucketName = bucketName;
// const objectKey = objectKey; // Change to the path of your image in the bucket

const params = {
  Bucket: bucketName,
  Key: objectKey,
};

s3.getObject(params, (err, data) => {
  if (err) {
    console.error(err);
    res.status(500).send('Error fetching the image');
    return;
  }

  res.setHeader('Content-Disposition', 'attachment; filename=image.jpg'); // Suggests a filename for the download
  res.setHeader('Content-Type', 'image/jpeg'); // Set the appropriate content type
  console.log(data.Body)
  res.send(data.Body);

});
}