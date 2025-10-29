import dotenv from "dotenv";
dotenv.config(); // must be at the top

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "./models/User"; // adjust path if needed

const seedAdmin = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URL;
    if (!mongoUrl) throw new Error("MONGODB_URI not found in .env");

    await mongoose.connect(mongoUrl);
    console.log("Connected to DB");

    const hashedPassword = await bcrypt.hash("adminpassword", 10);
    await User.create({
      name: "Admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin user created!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed admin:", err);
    process.exit(1);
  }
};

seedAdmin();
