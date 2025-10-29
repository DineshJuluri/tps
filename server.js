import express from "express";
import cors from "cors";
import { Cashfree, CFEnvironment } from "cashfree-pg";

const app = express();
app.use(cors());
app.use(express.json());

// ⚙️ Use SANDBOX environment for testing
const cashfree = new Cashfree(
  CFEnvironment.PRODUCTION,
  "75587810648a753a4169c403fd878557", // Test App ID
  "cfsk_ma_prod_3bf6724f3c418548dbffb57deecb1d7e_3af02444" // Test Secret Key
);

/**
 * 1️⃣ Create a Cashfree order for ₹1 test payment
 */
app.post("/create-order", async (req, res) => {
  try {
    const { username } = req.body;

    const orderPayload = {
      order_amount: 199.0,
      order_currency: "INR",
      order_id: "activation_" + Date.now(),
      customer_details: {
        customer_id: username || "guest_user",
        customer_name: username || "Guest",
        customer_email: `${username || "guest"}@example.com`,
        customer_phone: "9999999999",
      },
      order_meta: {
        return_url:
          "https://www.cashfree.com/devstudio/preview/pg/web/popupCheckout?order_id={order_id}",
      },
    };

    const response = await cashfree.PGCreateOrder(orderPayload);

    console.log("✅ Order created:", response.data);

    res.json({
      success: true,
      payment_session_id: response.data.payment_session_id,
      order_id: orderPayload.order_id,
    });
  } catch (error) {
    console.error("❌ Error creating order:", error.response?.data || error);
    res.status(500).json({
      success: false,
      message: "Failed to create Cashfree order",
    });
  }
});

/**
 * 2️⃣ Verify payment from Cashfree sandbox
 */
app.post("/verify-payment", async (req, res) => {
  try {
    console.log("🧾 Received verify request body:", req.body);

    const orderId = req.body.order_id;
    console.log("✅ Using orderId for fetch:", orderId);

    // ✅ pass string, not object
    const response = await cashfree.PGFetchOrder(orderId);
    const status = response.data.order_status;

    console.log(`🔍 Order ${orderId} status:`, status);

    if (status === "PAID") {
      return res.json({ success: true, message: "Payment successful" });
    } else {
      return res.json({ success: false, message: `Payment ${status}` });
    }
  } catch (error) {
    console.error("❌ Verification error:", error.response?.data || error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
});



app.listen(5000, () => {
  console.log("✅ Sandbox Cashfree server running on http://localhost:5000");
});
