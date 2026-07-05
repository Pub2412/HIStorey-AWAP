const express = require('express')
const router = express.Router()
const { checkAdmin, sendReceiptEmail, verifyToken } = require('../middlewares/auth')
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
      SELECT t.id, t.user_id, u.name AS customer_name, t.status, t.total_amount, t.shipping_address, t.created_at, t.updated_at
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

  return rows.map((row) => ({
    ...row,
    total_amount: Number(row.total_amount || 0),
    items: itemsMap[row.id] || []
  }))
}

async function getTransactionFromDb(id) {
  const rows = await sequelize.query(
    `
      SELECT t.id, t.user_id, u.name AS customer_name, t.status, t.total_amount, t.shipping_address, t.created_at, t.updated_at
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
          SELECT t.id, t.user_id, u.name AS customer_name, t.status, t.total_amount, t.shipping_address, t.created_at, t.updated_at
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

      const result = rows.map((row) => ({ ...row, total_amount: Number(row.total_amount || 0), items: itemsMap[row.id] || [] }))
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
      return res.json({ ...transaction, items })
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
    const { user_id = null, status = 'Pending', total_amount = 0, shipping_address = '', items = [] } = req.body
    try {
      const [result] = await sequelize.query(
        'INSERT INTO transactions (user_id, status, total_amount, shipping_address) VALUES (:user_id, :status, :total_amount, :shipping_address)',
        {
          replacements: { user_id, status, total_amount, shipping_address },
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

      return res.status(201).json({ id: transactionId, status, total_amount, shipping_address })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'DB error' })
    }
  }

  const { items = [], total = 0, email } = req.body
  const t = { id: nextTx++, items, total, email, status: 'created', updatedAt: new Date() }
  transactions.push(t)
  res.status(201).json(t)
})

// Update transaction; notify by email and attach receipt PDF when email provided
router.put('/transactions/:id', checkAdmin, async (req, res) => {
  if (await canUseDatabase()) {
    try {
      const transaction = await getTransactionFromDb(req.params.id)
      if (!transaction) return res.status(404).json({ message: 'Not found' })

      const status = req.body.status ?? transaction.status
      await sequelize.query('UPDATE transactions SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id', {
        replacements: { id: req.params.id, status },
        type: QueryTypes.UPDATE
      })

      if (req.body.sendEmail && req.body.email) {
        const info = await sendReceiptEmail({ id: transaction.id, status, total: transaction.total_amount, updatedAt: new Date(), items: [] })
        return res.json({ transaction: { ...transaction, status }, emailInfo: info })
      }

      return res.json({ transaction: { ...transaction, status } })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'DB error' })
    }
  }

  const t = transactions.find((x) => x.id === Number(req.params.id))
  if (!t) return res.status(404).json({ message: 'Not found' })
  t.status = req.body.status ?? t.status
  t.updatedAt = new Date()
  if (req.body.sendEmail && t.email) {
    try {
      const info = await sendReceiptEmail(t)
      return res.json({ transaction: t, emailInfo: info })
    } catch (err) {
      return res.status(500).json({ message: 'Email failed', error: err.message })
    }
  }
  res.json(t)
})

router.delete('/transactions/:id', checkAdmin, async (req, res) => {
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
