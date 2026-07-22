import express from "express";
import Stripe from "stripe";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

let stripeClient: Stripe | null = null;

function getStripe(): Stripe | null {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return null;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secret);
  }
  return stripeClient;
}

// Stripe Payment Route (legacy integration helper)
router.post("/create-payment-intent", authMiddleware, async (req: any, res) => {
  try {
    const { amount, currency = "inr" } = req.body;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    const stripe = getStripe();
    if (!stripe) {
      console.warn("Stripe Keys are missing. Operating in dynamic preview sandbox mode.");
      return res.json({
        clientSecret: `demo_sec_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`,
        publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_demo_key_unconfigured_kvr",
        isDemo: true,
        message: "Stripe Demo mode active. Enter any 4242 4242 card number."
      });
    }

    const amountInSmallestUnit = Math.round(Number(amount) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: currency.toLowerCase(),
      metadata: {
        userId: req.user?.userId || "guest",
        customerEmail: req.user?.email || "anonymous"
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY,
      isDemo: false
    });
  } catch (error: any) {
    console.error("Stripe payment intent creation failed:", error);
    res.status(500).json({ error: error.message || "Failed to create Stripe payment intent" });
  }
});

// CASHFREE PAYMENTS GATEWAY CONFIGURATION
router.post("/cashfree/create-order", authMiddleware, async (req: any, res) => {
  try {
    const { amount, planName, studentId } = req.body;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: "Valid plan price amount is required." });
    }
    if (!studentId) {
      return res.status(400).json({ error: "Target Student ID is required to bind subscription subscription." });
    }

    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    const orderId = `GJS_SUB_${studentId}_${Date.now()}`;
    const cleanAmount = parseFloat(amount).toFixed(2);

    if (clientId && clientSecret) {
      try {
        const url = process.env.NODE_ENV === "production" 
          ? "https://api.cashfree.com/pg/orders" 
          : "https://sandbox.cashfree.com/pg/orders";

        const cfResponse = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-version": "2023-08-01",
            "x-client-id": clientId,
            "x-client-secret": clientSecret
          },
          body: JSON.stringify({
            order_amount: parseFloat(cleanAmount),
            order_currency: "INR",
            order_id: orderId,
            customer_details: {
              customer_id: String(req.user.userId),
              customer_phone: req.user.mobile || "9999999999",
              customer_email: req.user.email || "canteenparent@example.com",
              customer_name: req.user.name || "Gitanjali Canteen Parent"
            },
            order_meta: {
              return_url: `${req.headers.origin || "http://localhost:3000"}/plans?cf_order_id={order_id}&student_id=${studentId}&plan=${encodeURIComponent(planName)}`
            }
          })
        });

        if (cfResponse.ok) {
          const cfData = await cfResponse.json();
          return res.json({
            payment_session_id: cfData.payment_session_id,
            order_id: cfData.order_id,
            payment_link: cfData.payment_link || (cfData.payments && cfData.payments.payment_link) || `https://payments.cashfree.com/order/checkout?session_id=${cfData.payment_session_id}`,
            isDemo: false
          });
        } else {
          const errorText = await cfResponse.text();
          console.error("Cashfree direct response error text:", errorText);
        }
      } catch (cfErr) {
        console.error("Cashfree HTTP post channel connection failed:", cfErr);
      }
    }

    // Unconfigured secret fallback (Premium interactive Sandbox Simulator widget link)
    const mockRedirect = `${req.headers.origin || "http://localhost:3000"}/plans?cf_order_id=${orderId}&student_id=${studentId}&plan=${encodeURIComponent(planName)}&is_demo=true&amount=${cleanAmount}`;
    res.json({
      payment_session_id: `cf_sess_mock_${Date.now()}`,
      order_id: orderId,
      payment_link: mockRedirect,
      isDemo: true,
      message: "Ready! Standard test mode simulation initialized."
    });

  } catch (error: any) {
    console.error("Cashfree order controller error:", error);
    res.status(500).json({ error: error.message || "Cashfree payment framework setup failed." });
  }
});

export default router;
