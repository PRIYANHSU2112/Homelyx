const mongoose = require("mongoose");
const cityModel = new mongoose.Schema(
  {
    cityName: String,
    cityId: Number,
    disable: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("cityModel", cityModel);
