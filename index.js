const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(
  express.json({
    verify: (req, res, buf, encoding) => {
      if (req.originalUrl === "/webhook") {
        req.rawBody = buf.toString(encoding || "utf-8");
      }
    },
  })
);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});
app.get("/", (req, res) => {
  res.send({ msg: "Hello World" });
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
  console.log(generated_signature, signature);

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
  const webhookSecret = process.env.RAZORPAY_SECRET;

  // Use the raw body captured by the middleware
  const requestBody = req.rawBody;

  const hash = crypto
    .createHmac("sha256", webhookSecret)
    .update(requestBody)
    .digest("hex");

  console.log("expectedSignature:", expectedSignature);
  console.log("generated hash:", hash);

  if (hash === expectedSignature) {
    console.log("Webhook signature valid");
    // Process event (existing logic)
    res.status(200).send("OK");
  } else {
    console.error("Webhook signature invalid");
    res.status(400).send("Invalid signature");
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
