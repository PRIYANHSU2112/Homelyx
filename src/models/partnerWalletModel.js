const mongoose = require("mongoose");

const partnerWalletSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Types.ObjectId,
      ref: "partnerProfileModel",
      required: true,
      unique: true,
      index: true,
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalEarnings: {
      type: Number,
      default: 0,
    },

    totalWithdrawn: {
      type: Number,
      default: 0,
    },

    totalCommissionPaid: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("partnerWalletModel", partnerWalletSchema);
