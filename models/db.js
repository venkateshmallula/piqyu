const mongoose = require("mongoose")

const newSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  employee_id: {
    type: String,
    required: true,
    unique: true,
  },
  mobile_number: {
    type: String,
    required: true,
    unique: true,
  },
  location: {
    type: String,
    required: true,
  },
  designation: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("User",newSchema)

module.exports = User