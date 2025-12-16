const Order = require('../models/Order');
const Alert = require('../models/Alert');

/**
 * Initialize Real-time Service
 * @param {Server} io - Socket.io Server instance
 */
const initRealtime = (io) => {
  console.log('Initializing Real-time Service...');

  // Socket.io Connection Handler
  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Join Branch Room
    socket.on('joinBranch', (branchId) => {
      if (branchId) {
        const room = `branch_${branchId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined room: ${room}`);
        socket.emit('joined', { room });
      }
    });

    // Leave Branch Room
    socket.on('leaveBranch', (branchId) => {
      if (branchId) {
        const room = `branch_${branchId}`;
        socket.leave(room);
        console.log(`Socket ${socket.id} left room: ${room}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // MongoDB Change Stream for Orders
  // Note: Requires MongoDB Replica Set or Atlas Cluster
  try {
    const orderChangeStream = Order.watch([], { fullDocument: 'updateLookup' });

    orderChangeStream.on('change', (change) => {
      processOrderChange(change, io);
    });

    orderChangeStream.on('error', (error) => {
      console.error('Order Change Stream Error:', error);
    });

    console.log('Listening for Order collection changes...');
  } catch (error) {
    console.error('Failed to initialize Change Stream (Requires Replica Set):', error.message);
  }
};

/**
 * Process and emit order changes
 * @param {Object} change - MongoDB Change Stream event
 * @param {Server} io - Socket.io Server instance
 */
const processOrderChange = async (change, io) => {
  const order = change.fullDocument;
  
  // Ensure we have an order and a branch ID to route the event
  if (!order || !order.branch) return;

  const branchId = order.branch.toString();
  const room = `branch_${branchId}`;
  
  let eventType = null;
  let payload = {
    orderId: order._id,
    data: order,
    timestamp: new Date()
  };

  let alertData = null;

  switch (change.operationType) {
    case 'insert':
      eventType = 'new_order';
      alertData = {
        type: 'order',
        title: 'New Order',
        message: `New order #${order.orderNumber || order._id.toString().slice(-4)} received`,
        relatedId: order._id
      };
      break;
      
    case 'update':
      const updatedFields = change.updateDescription.updatedFields;
      
      // Determine specific update type
      if (updatedFields.status) {
        eventType = 'order_status_change';
        payload.status = updatedFields.status;
        
        if (['ready', 'completed', 'cancelled'].includes(updatedFields.status)) {
           alertData = {
            type: 'system',
            title: 'Order Update',
            message: `Order #${order.orderNumber || order._id.toString().slice(-4)} is ${updatedFields.status}`,
            relatedId: order._id
          };
        }
      } else if (updatedFields.paymentMethod || updatedFields.amountPaid) {
        eventType = 'payment_confirmation';
        alertData = {
            type: 'payment',
            title: 'Payment Received',
            message: `Payment received for Order #${order.orderNumber || order._id.toString().slice(-4)}`,
            relatedId: order._id
          };
      } else if (updatedFields.table) {
        eventType = 'table_merge';
      } else {
        eventType = 'order_update'; // Generic update (e.g. items added)
      }
      break;
      
    case 'delete':
      eventType = 'order_deleted';
      break;
  }

  if (eventType) {
    // Emit to specific branch room
    io.to(room).emit(eventType, payload);
    console.log(`Emitted ${eventType} to ${room}`);
  }

  // Create and emit alert if applicable
  if (alertData) {
    try {
      const alert = await Alert.create({
        branch: branchId,
        ...alertData
      });
      
      io.to(room).emit('new_alert', alert);
      console.log(`Emitted new_alert to ${room}`);
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  }
};

module.exports = { initRealtime };
