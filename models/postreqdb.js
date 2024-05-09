const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  requester: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  priceQuotation: {
    type: String,
    required: false,
  },
  quantity: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: false,
  },
  status: {
    type: String,
    default: "pending",
  },
  Approver1: {
    type: String,
    required: false,
    default: "-",
  },
  Approver2: {
    type: String,
    required: false,
  },
  Approver3: {
    type: String,
    required: false,
  },
  FinanceApproval: {
    type: String,
    required: false,
  },
  Approver: {
    type: String,
    required: false,
  },
  observer: {
    type: String,
    required: false,
  },
  rejected_message: {
    type: String,
    required: false,
    default: "message",
  },
});

const postrequest = mongoose.model("postrequest", requestSchema);

module.exports = postrequest;
