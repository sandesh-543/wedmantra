const OrderModel = require('../models/orderModel');
const CartModel = require('../models/cartModel');
const PaymentModel = require('../models/paymentModel');
const ProductModel = require('../models/productModel');
const db = require('../config/db');

const OrderService = {
  async createOrder(orderData) {
    // Validation
    if (!orderData.user_id) throw new Error('User ID is required');
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }
    if (!orderData.shipping_full_name || !orderData.shipping_phone || !orderData.shipping_address_line1) {
      throw new Error('Shipping details are required');
    }

    // Validate items and calculate totals
    let subtotal = 0;
    for (const item of orderData.items) {
      const product = await ProductModel.getById(item.product_id);
      if (!product) throw new Error(`Product ${item.product_id} not found`);
      if (product.status !== 'active') throw new Error(`Product ${product.name} is not available`);
      if (item.quantity <= 0) throw new Error(`Invalid quantity for product ${product.name}`);
      
      const itemTotal = product.price * item.quantity;
      item.price = product.price;
      item.total_price = itemTotal;
      subtotal += itemTotal;
    }

    // Calculate final total
    const shipping = orderData.shipping_fee || 0;
    const tax = orderData.tax || 0;
    const discount = orderData.discount || 0;
    const total = subtotal + shipping + tax - discount;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const finalOrderData = {
      ...orderData,
      order_number: orderNumber,
      subtotal,
      total_amount: total,
      shipping_fee: shipping,
      tax,
      discount
    };

    return await OrderModel.create(finalOrderData);
  },

  async getUserOrders(userId) {
    return await OrderModel.getByUser(userId);
  },

  async getOrderById(id) {
    return await OrderModel.getById(id);
  },

  async updateOrderStatus(id, status, notes = '') {
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status');
    }
    return await OrderModel.updateStatus(id, status, notes);
  },

  // Order processing and payment integration
  async processOrder(orderId, paymentData) {
    const order = await OrderModel.getById(orderId);
    if (!order) throw new Error('Order not found');
    if (order.status !== 'pending') throw new Error('Order cannot be processed');

    // Create payment record
    const payment = await PaymentModel.create({
      order_id: orderId,
      payment_method: paymentData.method,
      amount: order.total_amount,
      status: paymentData.status || 'pending',
      currency: 'INR',
      gateway_response: paymentData.gateway_response,
      transaction_id: paymentData.transaction_id,
      razorpay_payment_id: paymentData.razorpay_payment_id,
      razorpay_order_id: paymentData.razorpay_order_id
    });

    // Update order status based on payment
    let orderStatus = 'pending';
    if (paymentData.status === 'completed') {
      orderStatus = 'confirmed';
    } else if (paymentData.status === 'failed') {
      orderStatus = 'cancelled';
    }

    await OrderModel.updateStatus(orderId, orderStatus, `Payment ${paymentData.status}`);

    return { order: await OrderModel.getById(orderId), payment };
  },

  async cancelOrder(orderId, reason = '') {
    const order = await OrderModel.getById(orderId);
    if (!order) throw new Error('Order not found');
    if (['delivered', 'cancelled', 'refunded'].includes(order.status)) {
      throw new Error('Order cannot be cancelled');
    }

    return await OrderModel.updateStatus(orderId, 'cancelled', reason);
  },

  async getOrderItems(orderId) {
    return await OrderModel.getOrderItems(orderId);
  },

  async addOrderItem(orderId, itemData) {
    // Validate product
    const product = await ProductModel.getById(itemData.product_id);
    if (!product) throw new Error('Product not found');
    if (product.status !== 'active') throw new Error('Product is not available');

    const totalPrice = product.price * itemData.quantity;
    return await OrderModel.addOrderItem(orderId, {
      ...itemData,
      price: product.price,
      total_price: totalPrice
    });
  },

  async updateOrderItem(itemId, updates) {
    if (updates.quantity <= 0) throw new Error('Quantity must be greater than 0');
    
    const item = await OrderModel.getOrderItems(itemId);
    if (!item) throw new Error('Order item not found');

    const totalPrice = item.price * updates.quantity;
    return await OrderModel.updateOrderItem(itemId, {
      ...updates,
      total_price: totalPrice
    });
  },

  async removeOrderItem(itemId) {
    return await OrderModel.removeOrderItem(itemId);
  },

  // Admin methods
  async getAllOrders() {
    const result = await db.query(
      `SELECT o.*, 
              u.full_name as customer_name,
              u.email as customer_email,
              json_agg(json_build_object(
                'id', oi.id,
                'product_id', oi.product_id,
                'quantity', oi.quantity,
                'price', oi.price,
                'total_price', oi.total_price
              )) as items
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       GROUP BY o.id, u.full_name, u.email
       ORDER BY o.created_at DESC`
    );
    return result.rows;
  },

  async getOrdersByAdmin(adminId) {
    const result = await db.query(
      `SELECT o.*, 
              u.full_name as customer_name,
              u.email as customer_email,
              json_agg(json_build_object(
                'id', oi.id,
                'product_id', oi.product_id,
                'quantity', oi.quantity,
                'price', oi.price,
                'total_price', oi.total_price
              )) as items
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE p.created_by = $1
       GROUP BY o.id, u.full_name, u.email
       ORDER BY o.created_at DESC`,
      [adminId]
    );
    return result.rows;
  }
};

module.exports = OrderService; 