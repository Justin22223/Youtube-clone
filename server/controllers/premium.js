import Razorpay from "razorpay";
import crypto from "crypto";
import Auth from "../models/auth.js";
import nodemailer from "nodemailer";

let razorpayInstance = null;
const getRazorpay = () => {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

export const createOrder = async (req, res) => {
  try {
    const { plan, currency = "INR" } = req.body;
    
    let amount = 99; // fallback
    if (plan === "Bronze") amount = 10;
    else if (plan === "Silver") amount = 50;
    else if (plan === "Gold") amount = 100;
    
    const options = {
      amount: amount * 100, // amount in smallest currency unit
      currency,
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await getRazorpay().orders.create(options);
    if (!order) return res.status(500).json({ message: "Some error occurred" });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, plan, amount } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Upgrade user to premium
      let userUpdated = null;
      const selectedPlan = plan || "Free";
      const updateData = { isPremium: true, plan: selectedPlan };
      
      try {
        if (userId && userId.length === 24) {
          userUpdated = await Auth.findByIdAndUpdate(userId, updateData, { new: true });
        }
      } catch (err) {
        console.error("Not a valid Mongo ID for findByIdAndUpdate:", err.message);
      }
      
      if (!userUpdated) {
        // Try by firebaseUid
        userUpdated = await Auth.findOneAndUpdate({ firebaseUid: userId }, updateData, { new: true });
      }

      if (!userUpdated) {
        // Try to update using username or email just in case the userId is completely messed up but we have it as email
        userUpdated = await Auth.findOneAndUpdate({ email: userId }, updateData, { new: true });
      }

      // Send Email Invoice
      if (userUpdated && userUpdated.email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });
          
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userUpdated.email,
            subject: `YouTube Clone - Premium Upgrade Invoice (${selectedPlan})`,
            html: `
              <div style="font-family: sans-serif; padding: 20px;">
                <h2 style="color: #2563EB;">Thank you for upgrading!</h2>
                <p>Hello ${userUpdated.username},</p>
                <p>Your payment of <strong>₹${amount || 99}</strong> for the <strong>${selectedPlan}</strong> plan was successful.</p>
                <p>Transaction ID: ${razorpay_payment_id}</p>
                <p>Enjoy your new premium features!</p>
                <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
                <p style="font-size: 12px; color: #888;">This is an automated receipt from YouTube Clone.</p>
              </div>
            `,
          };
          
          await transporter.sendMail(mailOptions);
        } catch (emailErr) {
          console.error("Failed to send email invoice:", emailErr);
        }
      }

      res.status(200).json({
        message: "Payment verified successfully",
        success: true,
      });
    } else {
      res.status(400).json({
        message: "Invalid Signature",
        success: false,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
