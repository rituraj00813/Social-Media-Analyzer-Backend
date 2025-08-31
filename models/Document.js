const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  filename: String,
  textContent: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Document", DocumentSchema);
