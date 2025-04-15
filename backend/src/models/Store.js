const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const storeSchema = new Schema(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    storeName: { type: String, required: true },
    description: { type: String },
    bannerImageURL: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Store", storeSchema);
