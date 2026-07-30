const mongoose = require("mongoose");

const uri = "mongodb+srv://sankhya:sydog2Qpc43QsspI@cluster0.xx4ujvv.mongodb.net/ddos_guard?appName=Cluster0";

mongoose.connect(uri)
  .then(() => {
    console.log("✅ Connected!");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });