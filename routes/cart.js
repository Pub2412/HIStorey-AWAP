const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { sendReceiptEmail } = require('../utils/nodemailer');
const { generateReceiptPDF } = require('../utils/pdfGenerator');

async function canUseDatabase() {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    return false;
  }
}

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Cart is now stored in localStorage on the client side
// This endpoint is kept for compatibility but doesn't store server-side cart
router.post('/cart/add', (req, res) => {
  // Cart items are managed in localStorage on the client
  // This endpoint can be used for validation or future server-side features
  res.json({ message: 'Cart is managed in localStorage on client side' });
});

// Cart items are retrieved from localStorage on the client
// This endpoint is kept for compatibility
router.get('/cart/:userId', (req, res) => {
  // Cart items are managed in localStorage on the client
  res.json({ message: 'Cart is managed in localStorage on client side' });
});

// Cart items are removed in localStorage on the client
// This endpoint is kept for compatibility
router.delete('/cart/:userId/:productId', (req, res) => {
  // Cart items are managed in localStorage on the client
  res.json({ message: 'Cart is managed in localStorage on client side' });
});

// Checkout - accepts cart items from client (localStorage) and creates database transaction
router.post('/cart/checkout', async (req, res) => {
  const { userId, email, items, shipping_address = '' } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Cart is empty or invalid' });
  }
  
  const total = calculateTotal(items);
  
  if (await canUseDatabase()) {
    try {
      // Check stock before processing checkout
      for (const item of items) {
        const [prod] = await sequelize.query(
          'SELECT stock, name FROM products WHERE id = :product_id AND is_deleted = 0',
          {
            replacements: { product_id: item.productId },
            type: QueryTypes.SELECT
          }
        );
        if (!prod) {
          return res.status(404).json({ message: `Product not found` });
        }
        if (prod.stock <= 0) {
          return res.status(400).json({ message: `"${prod.name}" is out of stock` });
        }
        if (prod.stock < (item.quantity || 1)) {
          return res.status(400).json({ message: `Only ${prod.stock} units of "${prod.name}" are available in stock` });
        }
      }

      const [result] = await sequelize.query(
        'INSERT INTO transactions (user_id, status, payment_status) VALUES (:user_id, :status, :payment_status)',
        {
          replacements: { 
            user_id: userId || null, 
            status: 'Pending', 
            payment_status: 'Pending'
          },
          type: QueryTypes.INSERT
        }
      );

      const transactionId = result || null;
      
      if (transactionId && items.length) {
        for (const item of items) {
          await sequelize.query(
            'INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price) VALUES (:transaction_id, :product_id, :quantity, :unit_price)',
            {
              replacements: {
                transaction_id: transactionId,
                product_id: item.productId,
                quantity: item.quantity || 1,
                unit_price: item.price || 0
              },
              type: QueryTypes.INSERT
            }
          );

          // Deduct product stock
          await sequelize.query(
            'UPDATE products SET stock = GREATEST(0, CAST(stock AS SIGNED) - :quantity) WHERE id = :product_id',
            {
              replacements: {
                quantity: item.quantity || 1,
                product_id: item.productId
              },
              type: QueryTypes.UPDATE
            }
          );
        }
      }

      // Send email if email is provided
      if (email && transactionId) {
        try {
          const transactionData = {
            id: transactionId,
            status: 'Pending',
            total,
            email,
            createdAt: new Date(),
            items
          };
          const pdfBuffer = await generateReceiptPDF(transactionData);
          await sendReceiptEmail(transactionData, pdfBuffer);
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
          // Continue with response even if email fails
        }
      }

      return res.status(201).json({ 
        id: transactionId, 
        status: 'Pending', 
        total_amount: total, 
        message: 'Transaction created successfully'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'DB error' });
    }
  }

  // Fallback to in-memory transaction
  const transaction = { 
    id: Date.now(), 
    items, 
    total, 
    email, 
    status: 'created', 
    createdAt: new Date() 
  };
  
  // Send email for in-memory transactions if email provided
  if (email) {
    try {
      const pdfBuffer = await generateReceiptPDF(transaction);
      await sendReceiptEmail(transaction, pdfBuffer);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }
  }
  
  res.status(201).json(transaction);
});

module.exports = router;