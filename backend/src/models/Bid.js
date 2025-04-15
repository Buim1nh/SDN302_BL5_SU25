const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bidSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    bidderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    bidTime: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bid", bidSchema);
