const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const shippingInfoSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    carrier: { type: String, required: true },
    trackingNumber: { type: String },
    status: {
      type: String,
      enum: ["pending", "shipped", "in_transit", "delivered"],
      default: "pending",
    },
    estimatedArrival: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShippingInfo", shippingInfoSchema);
