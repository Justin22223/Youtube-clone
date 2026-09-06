import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import Auth from "@/lib/models/auth";
import Video from "@/lib/models/video";
import Mailgun from "mailgun.js";
import formData from "form-data";

let mg = null;
const initMailgun = () => {
  if (!mg) {
    if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
      const mailgun = new Mailgun(formData);
      mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY });
    }
  }
  return mg;
};

export async function POST(req, { params }) {
  await dbConnect();
  
  // Await the params object in Next.js 15+
  const { action } = await params;
  const path = action.join("/");

  try {
    if (path === "register") {
      const { username, email, password, mobileNumber } = await req.json();
      const existingUser = await Auth.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return NextResponse.json({ message: "User already exists" }, { status: 400 });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = new Auth({ username, email, password: hashedPassword, mobileNumber, channelName: username });
      await newUser.save();
      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "7d" });
      return NextResponse.json({ token, user: { id: newUser._id, username, email } }, { status: 201 });
    }

    if (path === "login") {
      const { email, password, region } = await req.json();
      const user = await Auth.findOne({ email });
      if (!user) return NextResponse.json({ message: "Invalid credentials" }, { status: 400 });
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return NextResponse.json({ message: "Invalid credentials" }, { status: 400 });

      const southernStates = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"];
      const isSouthIndia = southernStates.includes(region);
      const otpMethod = isSouthIndia ? "email" : "mobile";

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();

      const mailer = initMailgun();
      if (mailer) {
        try {
           await mailer.messages.create(process.env.MAILGUN_DOMAIN, {
            from: `YouTube Clone Auth <mailgun@${process.env.MAILGUN_DOMAIN}>`,
            to: [user.email],
            subject: otpMethod === "email" ? "Your Login OTP" : "Your SMS Login OTP (Simulated via Email)",
            text: `Your OTP is: ${otp}`,
            html: `<b>Your OTP is: ${otp}</b>`,
          });
        } catch (emailErr) {
          console.error("Failed to send OTP via Mailgun:", emailErr.message);
        }
      }

      return NextResponse.json({
        requiresOtp: true,
        method: otpMethod,
        userId: user._id,
        message: `OTP sent via ${otpMethod}`,
        devOtp: otp // Included for dev testing as requested
      }, { status: 200 });
    }

    if (path === "verify-otp") {
      const { userId, otp } = await req.json();
      const user = await Auth.findById(userId);
      if (!user || !user.otp || user.otp !== otp || new Date() > user.otpExpiresAt) {
        return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });
      }
      user.otp = undefined;
      user.otpExpiresAt = undefined;
      await user.save();
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "7d" });
      return NextResponse.json({ token, user: { id: user._id, username: user.username, email: user.email, plan: user.plan } }, { status: 200 });
    }

    if (path === "firebase/save") {
      const { firebaseUid, email, username, displayName, avatar } = await req.json();
      const user = await Auth.findOneAndUpdate(
        { firebaseUid },
        { firebaseUid, email, username: username || email.split('@')[0], channelName: displayName || username || email.split('@')[0], avatar, authProvider: "google" },
        { upsert: true, new: true }
      );
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "7d" });
      return NextResponse.json({ token, user }, { status: 200 });
    }

    if (path.startsWith("download/")) {
      const videoId = path.split("/")[1];
      const { userId } = await req.json();
      let user = null;
      if (userId && userId.length === 24) user = await Auth.findById(userId);
      if (!user) user = await Auth.findOne({ firebaseUid: userId });
      if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastDownload = user.lastDownloadDate ? new Date(user.lastDownloadDate) : null;
      if (lastDownload) lastDownload.setHours(0, 0, 0, 0);
      const isToday = lastDownload && lastDownload.getTime() === today.getTime();

      if (user.plan === "Free") {
        if (isToday && user.downloadCountToday >= 1) {
          return NextResponse.json({ message: "Daily download limit reached. Upgrade to Premium.", requiresPremium: true }, { status: 403 });
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

      return NextResponse.json({ message: "Download tracked successfully", user }, { status: 200 });
    }

    return NextResponse.json({ message: "Route not found" }, { status: 404 });
  } catch (error) {
    console.error("Auth POST Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function GET(req, { params }) {
  await dbConnect();
  const { action } = await params;
  const path = action.join("/");

  try {
    if (path.startsWith("firebase/user/")) {
      const uid = path.split("/")[2];
      const user = await Auth.findOne({ firebaseUid: uid });
      if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });
      return NextResponse.json(user, { status: 200 });
    }

    if (path.startsWith("profile/")) {
      const id = path.split("/")[1];
      const user = await Auth.findById(id).select("-password");
      return NextResponse.json(user, { status: 200 });
    }

    if (path.startsWith("downloads/")) {
      const userId = path.split("/")[1];
      const user = await Auth.findById(userId);
      if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });
      const videos = await Video.find({ _id: { $in: user.downloadedVideos } });
      return NextResponse.json(videos, { status: 200 });
    }

    return NextResponse.json({ message: "Route not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  await dbConnect();
  const { action } = await params;
  const path = action.join("/");

  try {
    if (path.startsWith("profile/")) {
      const id = path.split("/")[1];
      const body = await req.json();
      const updatedUser = await Auth.findByIdAndUpdate(id, { $set: body }, { new: true }).select("-password");
      return NextResponse.json(updatedUser, { status: 200 });
    }

    if (path.startsWith("subscribe/")) {
      const id = path.split("/")[1];
      const { userId } = await req.json();
      const channelToSubscribe = await Auth.findById(id);
      const currentUser = await Auth.findById(userId);
      if (!currentUser.subscribedUsers.includes(id)) {
        await currentUser.updateOne({ $push: { subscribedUsers: id } });
        await channelToSubscribe.updateOne({ $inc: { subscribers: 1 } });
      } else {
        await currentUser.updateOne({ $pull: { subscribedUsers: id } });
        await channelToSubscribe.updateOne({ $inc: { subscribers: -1 } });
      }
      return NextResponse.json({ message: "Success" }, { status: 200 });
    }

    return NextResponse.json({ message: "Route not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
