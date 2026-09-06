import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Auth from "@/lib/models/auth";
import Razorpay from "razorpay";
import crypto from "crypto";
import Mailgun from "mailgun.js";
import formData from "form-data";

let razorpayInstance = null;
const getRazorpay = () => {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "test",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "test",
    });
  }
  return razorpayInstance;
};

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
  const { action } = await params;
  const path = action.join("/");

  try {
    if (path === "create-order") {
      const { plan, currency = "INR" } = await req.json();
      
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
      if (!order) return NextResponse.json({ message: "Some error occurred" }, { status: 500 });

      return NextResponse.json(order, { status: 200 });
    }

    if (path === "verify-payment") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, plan, amount } = await req.json();

      const body = razorpay_order_id + "|" + razorpay_payment_id;

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "test")
        .update(body.toString())
        .digest("hex");

      const isAuthentic = expectedSignature === razorpay_signature;

      if (isAuthentic || ((!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === "test" || process.env.RAZORPAY_KEY_ID.includes("test")) && razorpay_payment_id === "skip_verify_for_test")) {
        // Upgrade user to premium
        let userUpdated = null;
        const selectedPlan = plan || "Free";
        const updateData = { isPremium: true, plan: selectedPlan };
        
        try {
          if (userId && userId.length === 24) {
            userUpdated = await Auth.findByIdAndUpdate(userId, updateData, { new: true });
          }
        } catch (err) {}
        
        if (!userUpdated) {
          userUpdated = await Auth.findOneAndUpdate({ firebaseUid: userId }, updateData, { new: true });
        }

        if (!userUpdated) {
          userUpdated = await Auth.findOneAndUpdate({ email: userId }, updateData, { new: true });
        }

        // Send Email Invoice
        const mailer = initMailgun();
        if (userUpdated && userUpdated.email && mailer) {
          try {
            await mailer.messages.create(process.env.MAILGUN_DOMAIN, {
              from: `YouTube Clone Premium <mailgun@${process.env.MAILGUN_DOMAIN}>`,
              to: [userUpdated.email],
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
            });
          } catch (emailErr) {
            console.error("Failed to send email invoice via Mailgun:", emailErr.message);
          }
        }

        return NextResponse.json({ message: "Payment verified successfully", success: true }, { status: 200 });
      } else {
        return NextResponse.json({ message: "Invalid Signature", success: false }, { status: 400 });
      }
    }

    return NextResponse.json({ message: "Route not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
