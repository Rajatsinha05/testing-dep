const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

app.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100, // amount in the smallest currency unit
      currency: "INR",
      receipt: "order_rcptid_11",
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating order");
  }
});

app.post("/verify-payment", (req, res) => {
  const { order_id, payment_id, signature } = req.body;
  const key_secret = process.env.RAZORPAY_SECRET;

  let hmac = crypto.createHmac("sha256", key_secret);
  hmac.update(order_id + "|" + payment_id);
  const generated_signature = hmac.digest("hex");

  if (generated_signature === signature) {
    // Payment is successful
    // Update your database here
    res.json({ success: true, message: "Payment verified successfully" });
  } else {
    // Payment is not successful
    res
      .status(400)
      .json({ success: false, message: "Payment verification failed" });
  }
});

app.post("/webhook", (req, res) => {
  const expectedSignature = req.headers["x-razorpay-signature"];
  const webhookSecret = process.env.RAZORPAY_SECRET; // Use the same secret from your .env file
  const requestBody = JSON.stringify(req.body);
  console.log("req.headers", req.headers);

  const hash = crypto
    .createHmac("sha256", webhookSecret)
    .update(requestBody)
    .digest("hex");

  console.log("expectedSignature: ", expectedSignature);
  console.log("hash: ", hash);
  if (hash === expectedSignature) {
    // Signature is valid
    console.log("Webhook received and signature is valid");

    const event = req.body.event;

    // Handle different event types
    switch (event) {
      case "payment.authorized":
        // Handle payment authorized event
        console.log("Payment Authorized:", req.body.payload.payment.entity);
        break;
      case "payment.failed":
        // Handle payment failed event
        console.log("Payment Failed:", req.body.payload.payment.entity);
        break;
      case "payment.captured":
        // Handle payment captured event
        console.log("Payment Captured:", req.body.payload.payment.entity);
        break;
      case "payment_link.paid":
        // Handle payment link paid event
        console.log("Payment Link Paid:", req.body.payload.payment_link.entity);
        break;
      default:
        console.log("Unhandled event:", event);
    }

    // Respond with a 200 OK status
    res.status(200).send("OK");
  } else {
    // Signature is invalid
    console.log("Webhook signature verification failed");
    res.status(400).send("Invalid signature");
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
