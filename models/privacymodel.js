// Import Mongoose
const mongoose = require("mongoose");

// Define the schema
const PrivacyPolicySchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a model from the schema
const PrivacyPolicy = mongoose.model("PrivacyPolicy", PrivacyPolicySchema);

// Export the model
module.exports = PrivacyPolicy;
