const OrderTrackingModel = require('../models/orderTrackingModel');
const notificationService = require('./notificationService');

const OrderTrackingService = {
  // Get full order tracking details
  async getOrderTracking(orderId, userId = null) {
    const order = await OrderTrackingModel.getOrderWithTracking(orderId, userId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    // Get delivery estimate
    const deliveryEstimate = await OrderTrackingModel.getDeliveryEstimate(orderId);

    // Format for mobile/frontend consumption
    const tracking = {
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
        totalAmount: order.total_amount,
        createdAt: order.created_at,
        shippedAt: order.shipped_at,
        deliveredAt: order.delivered_at,
        trackingNumber: order.tracking_number
      },
      
      customer: {
        name: `${order.first_name} ${order.last_name || ''}`.trim(),
        email: order.email,
        phone: order.user_phone
      },
      
      shipping: {
        name: order.shipping_full_name,
        phone: order.shipping_phone,
        address: `${order.shipping_address_line1}, ${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}`
      },
      
      items: order.items || [],
      
      timeline: this.formatTimeline(order.status_history || [], order),
      
      delivery: deliveryEstimate,
      
      canCancel: this.canCancelOrder(order.status),
      canReturn: this.canReturnOrder(order.status, order.delivered_at)
    };

    return tracking;
  },

  // Public tracking by order number
  async getPublicTracking(orderNumber) {
    const order = await OrderTrackingModel.getTrackingByOrderNumber(orderNumber);
    
    if (!order) {
      throw new Error('Order not found');
    }

    return {
      orderNumber: order.order_number,
      status: order.status,
      createdAt: order.created_at,
      shippedAt: order.shipped_at,
      deliveredAt: order.delivered_at,
      trackingNumber: order.tracking_number,
      timeline: this.formatTimeline(order.status_history || [], order),
      delivery: await OrderTrackingModel.getDeliveryEstimate(order.id)
    };
  },

  // Update order status (admin function)
  async updateOrderStatus(orderId, statusData, adminId) {
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
    
    if (!validStatuses.includes(statusData.status)) {
      throw new Error('Invalid order status');
    }

    // Auto-set timestamps
    if (statusData.status === 'shipped' && !statusData.shipped_at) {
      statusData.shipped_at = new Date();
    }
    
    if (statusData.status === 'delivered' && !statusData.delivered_at) {
      statusData.delivered_at = new Date();
    }

    const updatedOrder = await OrderTrackingModel.updateOrderStatus(orderId, statusData, adminId);

    // Send notification to user
    try {
      await this.sendStatusNotification(updatedOrder, statusData.status);
    } catch (error) {
      console.error('Failed to send status notification:', error);
      // Don't fail the status update if notification fails
    }

    return updatedOrder;
  },

  // Format timeline for frontend
  formatTimeline(statusHistory, order) {
    const timelineSteps = [
      { status: 'pending', title: 'Order Placed', description: 'Your order has been placed successfully' },
      { status: 'confirmed', title: 'Order Confirmed', description: 'Your order has been confirmed and is being prepared' },
      { status: 'processing', title: 'Processing', description: 'Your order is being processed' },
      { status: 'shipped', title: 'Shipped', description: 'Your order has been shipped' },
      { status: 'delivered', title: 'Delivered', description: 'Your order has been delivered successfully' }
    ];

    return timelineSteps.map(step => {
      const historyItem = statusHistory.find(h => h.status === step.status);
      const isCompleted = historyItem !== undefined;
      const isCurrent = order.status === step.status;
      
      return {
        ...step,
        isCompleted,
        isCurrent,
        timestamp: historyItem?.created_at || null,
        notes: historyItem?.notes || null
      };
    });
  },

  // Check if order can be cancelled
  canCancelOrder(status) {
    return ['pending', 'confirmed'].includes(status);
  },

  // Check if order can be returned
  canReturnOrder(status, deliveredAt) {
    if (status !== 'delivered' || !deliveredAt) {
      return false;
    }
    
    // Allow returns within 7 days
    const deliveryDate = new Date(deliveredAt);
    const now = new Date();
    const daysSinceDelivery = (now - deliveryDate) / (1000 * 60 * 60 * 24);
    
    return daysSinceDelivery <= 7;
  },

  // Send status update notification
  async sendStatusNotification(order, newStatus) {
    const statusMessages = {
      confirmed: 'Your order has been confirmed!',
      processing: 'Your order is being processed',
      shipped: 'Your order has been shipped!',
      delivered: 'Your order has been delivered successfully!',
      cancelled: 'Your order has been cancelled',
      returned: 'Your return has been processed'
    };

    if (statusMessages[newStatus]) {
      await notificationService.createNotification({
        user_id: order.user_id,
        type: 'order_update',
        title: 'Order Update',
        message: statusMessages[newStatus],
        data: {
          orderId: order.id,
          orderNumber: order.order_number,
          status: newStatus
        }
      });
    }
  },

  // Get orders needing attention (admin dashboard)
  async getOrdersNeedingUpdate() {
    return await OrderTrackingModel.getOrdersNeedingUpdate();
  }
};

module.exports = OrderTrackingService;