import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Auth from "../models/auth.js";
import Video from "../models/video.js";
import formData from "form-data";
import Mailgun from "mailgun.js";

// Mailgun client (will be initialized on first use)
let mg = null;
const initMailgun = () => {
  if (!mg) {
    if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
      const mailgun = new Mailgun(formData);
      mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY });
      console.log("Configured Mailgun API.");
    } else {
      console.warn("No MAILGUN_API_KEY or MAILGUN_DOMAIN found. Skipping real email sending. OTPs will be printed to console only.");
    }
  }
  return mg;
};

export const register = async (req, res) => {
  try {
    const { username, email, password, mobileNumber } = req.body;
    const existingUser = await Auth.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.username === username && existingUser.email !== email) {
        return res.status(400).json({ message: "Username already taken" });
      }
      return res.status(400).json({ message: "User already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new Auth({ username, email, password: hashedPassword, mobileNumber, channelName: username });
    await newUser.save();
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: newUser._id, username, email } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, region } = req.body;
    const user = await Auth.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    
    const southernStates = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"];
    const isSouthIndia = southernStates.includes(region);
    const otpMethod = isSouthIndia ? "email" : "mobile";

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    if (otpMethod === "email") {
      const mailer = initMailgun();
      console.log(`[EMAIL] Sending OTP ${otp} to email ${user.email} (Region: ${region})`);
      if (mailer) {
        try {
          const msg = await mailer.messages.create(process.env.MAILGUN_DOMAIN, {
            from: `YouTube Clone Auth <mailgun@${process.env.MAILGUN_DOMAIN}>`,
            to: [user.email],
            subject: "Your Login OTP",
            text: `Your OTP for login is: ${otp}`,
            html: `<b>Your OTP for login is: ${otp}</b>`,
          });
          console.log(`Email sent via Mailgun:`, msg.id);
        } catch (emailErr) {
          console.error("Failed to send email via Mailgun:", emailErr.message);
        }
      } else {
        console.log(`[DEV MODE] Your OTP is: ${otp}`);
      }
    } else {
      const mailer = initMailgun();
      const mobile = user.mobileNumber || "Not Provided";
      console.log(`[SMS SIMULATION] Simulating SMS OTP ${otp} to ${mobile} via Email (Region: ${region || "Unknown"})`);
      if (mailer) {
        try {
          const msg = await mailer.messages.create(process.env.MAILGUN_DOMAIN, {
            from: `YouTube Clone Auth <mailgun@${process.env.MAILGUN_DOMAIN}>`,
            to: [user.email],
            subject: "Your SMS Login OTP",
            text: `This is a simulation of an SMS to ${mobile}. Your OTP is: ${otp}`,
            html: `<b>This is a simulation of an SMS to ${mobile}. Your OTP is: ${otp}</b>`,
          });
          console.log(`SMS Simulation Email sent via Mailgun:`, msg.id);
        } catch (emailErr) {
          console.error("Failed to send SMS simulation via Mailgun:", emailErr.message);
        }
      } else {
        console.log(`[DEV MODE] Your SMS OTP is: ${otp}`);
      }
    }

    res.status(200).json({
      requiresOtp: true,
      method: otpMethod,
      userId: user._id,
      message: `OTP sent via ${otpMethod}`,
      devOtp: otp
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await Auth.findById(userId);
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!user.otp || user.otp !== otp || new Date() > user.otpExpiresAt) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

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

export const trackDownload = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { userId } = req.body;
    
    let user = null;
    try {
      if (userId && userId.length === 24) {
        user = await Auth.findById(userId);
      }
    } catch (err) {
      console.error("Not a valid Mongo ID for findById:", err.message);
    }
    
    if (!user) {
      user = await Auth.findOne({ firebaseUid: userId });
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastDownload = user.lastDownloadDate ? new Date(user.lastDownloadDate) : null;
    if (lastDownload) lastDownload.setHours(0, 0, 0, 0);

    const isToday = lastDownload && lastDownload.getTime() === today.getTime();

    if (!user.isPremium) {
      if (isToday && user.downloadCountToday >= 1) {
        return res.status(403).json({ message: "Daily download limit reached. Upgrade to Premium.", requiresPremium: true });
      }
    }

    if (!user.downloadedVideos.includes(videoId)) {
      user.downloadedVideos.push(videoId);
    }

    if (!isToday) {
      user.downloadCountToday = 1;
    } else {
      user.downloadCountToday += 1;
    }
    
    user.lastDownloadDate = new Date();
    await user.save();

    res.status(200).json({ message: "Download tracked successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDownloads = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await Auth.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch video details
    const videos = await Video.find({ _id: { $in: user.downloadedVideos } });
    
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};