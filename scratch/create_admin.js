const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: String,
    pass: String,
    role: String
});
const User = mongoose.model("User", UserSchema);

async function createAdmin() {
    await mongoose.connect("mongodb://localhost:27017/challange");
    const admin = await User.findOne({ name: "admin" });
    if (admin) {
        admin.role = "admin";
        await admin.save();
        console.log("Admin role updated for user 'admin'");
    } else {
        const newAdmin = new User({ name: "admin", pass: "admin123", role: "admin" });
        await newAdmin.save();
        console.log("Admin user 'admin' created with password 'admin123'");
    }
    await mongoose.disconnect();
}

createAdmin();
