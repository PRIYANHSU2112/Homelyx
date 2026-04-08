const mongoose = require("mongoose");

const withdrawRequestSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Types.ObjectId,
      ref: "partnerProfileModel",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"],
      default: "PENDING",
    },

    bankDetails: {
      accountHolderName: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      upiId: String,
    },

    adminNote: {
      type: String,
      default: "",
    },

    processedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
withdrawRequestSchema.index({ partnerId: 1, createdAt: -1 });
withdrawRequestSchema.index({ status: 1 });

module.exports = mongoose.model("withdrawRequestModel", withdrawRequestSchema);
