const express = require('express')
const router = express.Router()
const { checkAdmin, verifyToken } = require('../middlewares/auth')
const { sendReceiptEmail } = require('../utils/nodemailer')
const { generateReceiptPDF } = require('../utils/pdfGenerator')
const sequelize = require('../config/database')
const { QueryTypes } = require('sequelize')


// In-memory fallback transactions
const transactions = []
let nextTx = 1

async function canUseDatabase() {
  try {
    await sequelize.authenticate()
    return true
  } catch (error) {
    return false
  }
}

async function listTransactionsFromDb() {
  const rows = await sequelize.query(
    `
      SELECT t.id, t.user_id, u.name AS customer_name, t.status, t.payment_status, t.created_at, t.updated_at
      FROM transactions t
      LEFT JOIN users u ON u.id = t.user_id
      ORDER BY t.created_at DESC
    `,
    { type: QueryTypes.SELECT }
  )

  const itemsRows = await sequelize.query(
    `
      SELECT ti.transaction_id, ti.product_id, p.name AS product_name, ti.quantity, ti.unit_price
      FROM transaction_items ti
      LEFT JOIN products p ON p.id = ti.product_id
    `,
    { type: QueryTypes.SELECT }
  )

  const itemsMap = {}
  itemsRows.forEach((item) => {
    if (!itemsMap[item.transaction_id]) {
      itemsMap[item.transaction_id] = []
    }
    itemsMap[item.transaction_id].push({
      product_id: item.product_id,
      name: item.product_name,
      quantity: Number(item.quantity || 0),
      unit_price: Number(item.unit_price || 0)
    })
  })

  return rows.map((row) => {
    const items = itemsMap[row.id] || []
    const calculatedTotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
    return {
      ...row,
      total_amount: calculatedTotal,
      items
    }
  })
}

async function getTransactionFromDb(id) {
  const rows = await sequelize.query(
    `
      SELECT t.id, t.user_id, u.name AS customer_name, u.email AS email, t.status, t.payment_status, t.created_at, t.updated_at
      FROM transactions t
      LEFT JOIN users u ON u.id = t.user_id
      WHERE t.id = :id
    `,
    { replacements: { id }, type: QueryTypes.SELECT }
  )

  return rows[0] || null
}

async function getItemsForTransaction(id) {
  const rows = await sequelize.query(
    `
      SELECT ti.id, ti.product_id, p.name AS product_name, ti.quantity, ti.unit_price
      FROM transaction_items ti
      LEFT JOIN products p ON p.id = ti.product_id
      WHERE ti.transaction_id = :id
      ORDER BY ti.id
    `,
    { replacements: { id }, type: QueryTypes.SELECT }
  )

  return rows.map((row) => ({ ...row, unit_price: Number(row.unit_price || 0) }))
}

router.get('/transactions', async (req, res) => {
  if (await canUseDatabase()) {
    try {
      return res.json(await listTransactionsFromDb())
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'DB error' })
    }
  }

  res.json(transactions)
})

// Authenticated user's transactions
router.get('/transactions/mine', verifyToken, async (req, res) => {
  const userId = req.user && req.user.id ? Number(req.user.id) : null
  if (!userId) return res.status(401).json({ message: 'Authentication required' })

  if (await canUseDatabase()) {
    try {
      const rows = await sequelize.query(
        `
          SELECT t.id, t.user_id, u.name AS customer_name, t.status, t.payment_status, t.created_at, t.updated_at
          FROM transactions t
          LEFT JOIN users u ON u.id = t.user_id
          WHERE t.user_id = :userId
          ORDER BY t.created_at DESC
        `,
        { replacements: { userId }, type: QueryTypes.SELECT }
      )

      const itemsRows = await sequelize.query(
        `
          SELECT ti.transaction_id, ti.product_id, p.name AS product_name, ti.quantity, ti.unit_price
          FROM transaction_items ti
          LEFT JOIN products p ON p.id = ti.product_id
          WHERE ti.transaction_id IN (SELECT id FROM transactions WHERE user_id = :userId)
        `,
        { replacements: { userId }, type: QueryTypes.SELECT }
      )

      const itemsMap = {}
      itemsRows.forEach((item) => {
        if (!itemsMap[item.transaction_id]) itemsMap[item.transaction_id] = []
        itemsMap[item.transaction_id].push({ product_id: item.product_id, name: item.product_name, quantity: Number(item.quantity || 0), unit_price: Number(item.unit_price || 0) })
      })

      const result = rows.map((row) => {
        const items = itemsMap[row.id] || []
        const calculatedTotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
        return { ...row, total_amount: calculatedTotal, items }
      })
      return res.json(result)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'DB error' })
    }
  }

  // fallback: filter in-memory transactions
  const mine = transactions.filter((t) => Number(t.user_id) === Number(userId))
  return res.json(mine)
})

router.get('/transactions/:id', async (req, res) => {
  if (await canUseDatabase()) {
    try {
      const transaction = await getTransactionFromDb(req.params.id)
      if (!transaction) return res.status(404).json({ message: 'Not found' })
      const items = await getItemsForTransaction(req.params.id)
      const calculatedTotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
      return res.json({ ...transaction, total_amount: calculatedTotal, items })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'DB error' })
    }
  }

  const t = transactions.find((x) => x.id === Number(req.params.id))
  if (!t) return res.status(404).json({ message: 'Not found' })
  res.json(t)
})

router.post('/transactions', async (req, res) => {
  if (await canUseDatabase()) {
    const { user_id = null, status = 'Pending', payment_status = 'Pending', items = [], email } = req.body
    try {
      const [result] = await sequelize.query(
        'INSERT INTO transactions (user_id, status, payment_status) VALUES (:user_id, :status, :payment_status)',
        {
          replacements: { user_id, status, payment_status },
          type: QueryTypes.INSERT
        }
      )

      const transactionId = result || null
      if (transactionId && Array.isArray(items) && items.length) {
        for (const item of items) {
          await sequelize.query(
            'INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price) VALUES (:transaction_id, :product_id, :quantity, :unit_price)',
            {
              replacements: {
                transaction_id: transactionId,
                product_id: item.product_id,
                quantity: item.quantity || 1,
                unit_price: item.unit_price || 0
              },
              type: QueryTypes.INSERT
            }
          )
        }
      }

      const calculatedTotal = items.reduce((sum, item) => sum + (item.unit_price || item.price || 0) * (item.quantity || 1), 0)

      // Send email if email is provided
      if (email && transactionId) {
        try {
          const transactionData = {
            id: transactionId,
            status,
            total: calculatedTotal,
            email,
            createdAt: new Date(),
            items: items || []
          }
          const pdfBuffer = await generateReceiptPDF(transactionData)
          await sendReceiptEmail(transactionData, pdfBuffer)
        } catch (emailError) {
          console.error('Email sending failed:', emailError)
          // Continue with response even if email fails
        }
      }

      return res.status(201).json({ id: transactionId, status, payment_status, total_amount: calculatedTotal })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'DB error' })
    }
  }

  const { items = [], total = 0, email } = req.body
  const t = { id: nextTx++, items, total, email, status: 'created', payment_status: 'Pending', updatedAt: new Date() }
  transactions.push(t)
  
  // Send email for in-memory transactions if email provided
  if (email) {
    try {
      const pdfBuffer = await generateReceiptPDF(t)
      await sendReceiptEmail(t, pdfBuffer)
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
    }
  }
  
  res.status(201).json(t)
})

// Update transaction; automatically send email with PDF receipt when email is available
router.put('/transactions/:id', verifyToken, checkAdmin, async (req, res) => {
  if (await canUseDatabase()) {
    try {
      const transaction = await getTransactionFromDb(req.params.id)
      if (!transaction) return res.status(404).json({ message: 'Not found' })

      const items = await getItemsForTransaction(req.params.id)
      const status = req.body.status ?? transaction.status
      const payment_status = req.body.payment_status ?? transaction.payment_status
      const email = req.body.email || transaction.email
      
      await sequelize.query('UPDATE transactions SET status = :status, payment_status = :payment_status, updated_at = CURRENT_TIMESTAMP WHERE id = :id', {
        replacements: { id: req.params.id, status, payment_status },
        type: QueryTypes.UPDATE
      })

      const calculatedTotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

      // Automatically send email if email is available
      if (email) {
        try {
          const transactionData = {
            id: transaction.id,
            status,
            payment_status,
            total: calculatedTotal,
            email,
            updatedAt: new Date(),
            items: items || [],
            isUpdate: true
          }
          const pdfBuffer = await generateReceiptPDF(transactionData)
          const info = await sendReceiptEmail(transactionData, pdfBuffer)
          return res.json({ transaction: { ...transaction, status, payment_status, total_amount: calculatedTotal }, emailInfo: info })
        } catch (emailError) {
          console.error('Email sending failed:', emailError)
          // Continue with response even if email fails
        }
      }

      return res.json({ transaction: { ...transaction, status, payment_status, total_amount: calculatedTotal } })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'DB error' })
    }
  }

  const t = transactions.find((x) => x.id === Number(req.params.id))
  if (!t) return res.status(404).json({ message: 'Not found' })
  t.status = req.body.status ?? t.status
  t.payment_status = req.body.payment_status ?? t.payment_status
  t.updatedAt = new Date()
  
  // Automatically send email if email is available
  if (t.email) {
    try {
      const pdfBuffer = await generateReceiptPDF(t)
      const info = await sendReceiptEmail(t, pdfBuffer)
      return res.json({ transaction: t, emailInfo: info })
    } catch (err) {
      console.error('Email sending failed:', err)
      // Continue with response even if email fails
    }
  }
  
  res.json(t)
})

router.delete('/transactions/:id', verifyToken, checkAdmin, async (req, res) => {
  if (await canUseDatabase()) {
    try {
      await sequelize.query('DELETE FROM transactions WHERE id = :id', { replacements: { id: req.params.id }, type: QueryTypes.DELETE })
      return res.json({ message: 'Deleted' })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'DB error' })
    }
  }

  const idx = transactions.findIndex((x) => x.id === Number(req.params.id))
  if (idx === -1) return res.status(404).json({ message: 'Not found' })
  transactions.splice(idx, 1)
  res.json({ message: 'Deleted' })
})

module.exports = router
