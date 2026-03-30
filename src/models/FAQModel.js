const mongoose = require("mongoose");

const FAQModel = new mongoose.Schema(
  {
    question: String,
    answer: String,

    helpSupportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "help&support",
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FAQModel", FAQModel);
