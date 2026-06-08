import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Auth from "../models/auth.js";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await Auth.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new Auth({ username, email, password: hashedPassword, channelName: username });
    await newUser.save();
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: newUser._id, username, email } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Auth.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(200).json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const saveFirebaseUser = async (req, res) => {
  try {
    const { firebaseUid, email, username, displayName, avatar } = req.body;
    const user = await Auth.findOneAndUpdate(
      { firebaseUid },
      { firebaseUid, email, username: username || email.split('@')[0], channelName: displayName || username || email.split('@')[0], avatar, authProvider: "google" },
      { upsert: true, new: true }
    );
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserByFirebaseUid = async (req, res) => {
  try {
    const user = await Auth.findOne({ firebaseUid: req.params.uid });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await Auth.findById(req.params.id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const updatedUser = await Auth.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).select("-password");
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const subscribeToChannel = async (req, res) => {
  try {
    const channelToSubscribe = await Auth.findById(req.params.id);
    const currentUser = await Auth.findById(req.body.userId);
    if (!currentUser.subscribedUsers.includes(req.params.id)) {
      await currentUser.updateOne({ $push: { subscribedUsers: req.params.id } });
      await channelToSubscribe.updateOne({ $inc: { subscribers: 1 } });
    } else {
      await currentUser.updateOne({ $pull: { subscribedUsers: req.params.id } });
      await channelToSubscribe.updateOne({ $inc: { subscribers: -1 } });
    }
    res.status(200).json({ message: "Success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};