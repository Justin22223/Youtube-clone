import mongoose from "mongoose";
import dotenv from "dotenv";
import Auth from "./models/auth.js";

dotenv.config();

const cleanDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("Connected to MongoDB...");
    
    const result = await Auth.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} user(s) from the Auth collection.`);
    
    await mongoose.connection.close();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error cleaning database:", error);
    process.exit(1);
  }
};

cleanDB();
