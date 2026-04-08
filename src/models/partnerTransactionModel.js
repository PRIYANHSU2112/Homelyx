const mongoose = require("mongoose");

const partnerTransactionSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Types.ObjectId,
      ref: "partnerProfileModel",
      required: true,
    },

    orderId: {
      type: mongoose.Types.ObjectId,
      refPath: "orderModelRef",
      default: null,
    },

    // Dynamic ref: ecommerce orders vs service orders
    orderModelRef: {
      type: String,
      enum: ["e-commorderModel", "orderModel"],
      default: "e-commorderModel",
    },

    bookingId: {
      type: mongoose.Types.ObjectId,
      ref: "bookingModel",
      default: null,
    },

    orderType: {
      type: String,
      enum: ["ECOMMERCE", "SERVICE"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    commissionPercent: {
      type: Number,
      default: 0,
    },

    commissionAmount: {
      type: Number,
      default: 0,
    },

    netAmount: {
      type: Number,
      required: true,
    },

    transactionType: {
      type: String,
      enum: ["ORDER_CREDIT", "WITHDRAWAL", "WITHDRAWAL_REVERSAL", "ADJUSTMENT"],
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "COMPLETED",
    },

    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
partnerTransactionSchema.index({ partnerId: 1, createdAt: -1 });
partnerTransactionSchema.index({ orderId: 1 });
partnerTransactionSchema.index({ bookingId: 1 });
partnerTransactionSchema.index({ status: 1 });
partnerTransactionSchema.index({ transactionType: 1 });
partnerTransactionSchema.index({ orderType: 1 });

module.exports = mongoose.model("partnerTransactionModel", partnerTransactionSchema);
