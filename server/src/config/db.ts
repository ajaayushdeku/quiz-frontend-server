import mongoose from "mongoose";
import envConfig from "./config";

const connectToDatabase = async () => {
  try {
    console.log("Connecting to MongoDB...");
    // mongoose.connection.on("connected", () => {
    //   console.log("connected to db successfully");
    // });
    await mongoose.connect(envConfig.mongodbString as string);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.log("❌ Failed to connect to MongoDB: ", error);
    process.exit(1);
  }
};

export default connectToDatabase;
