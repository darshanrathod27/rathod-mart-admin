// backend/controllers/orderController.js
import asyncHandler from "../middleware/asyncHandler.js";
import Order from "../models/Order.js";
import { reduceStockInternal } from "./inventoryController.js";

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    discountPrice,
    totalPrice,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error("No order items");
  } else {
    // 1. Create the Order
    const order = new Order({
      orderItems: orderItems.map((x) => ({
        ...x,
        product: x.product,
        variant: x.variant || null, // Ensure variant is null if undefined
        _id: undefined, // Remove cart item _id to avoid conflicts
      })),
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      discountPrice,
      totalPrice,
      isPaid: paymentMethod === "online", // Logic for later
      paidAt: paymentMethod === "online" ? Date.now() : null,
    });

    const createdOrder = await order.save();

    // 2. Reduce Stock for each item
    // Using Promise.all to handle multiple async operations in parallel
    try {
      await Promise.all(
        createdOrder.orderItems.map(async (item) => {
          await reduceStockInternal(
            item.product,
            item.variant,
            item.qty,
            createdOrder._id
          );
        })
      );
    } catch (error) {
      // If stock reduction fails (race condition), consider rolling back order or alerting admin
      // For now, we throw error so frontend knows something went wrong
      console.error("Stock reduction failed:", error.message);
      // Optional: await Order.findByIdAndDelete(createdOrder._id);
      throw new Error(
        "Order placed but failed to update stock: " + error.message
      );
    }

    res.status(201).json(createdOrder);
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  res.json(orders);
});
