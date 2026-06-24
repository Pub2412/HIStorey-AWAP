const express = require('express')
const router = express.Router()
const { checkAdmin, sendReceiptEmail } = require('../middlewares/auth')

// In-memory transactions
const transactions = []
let nextTx = 1

router.get('/transactions', (req, res) => {
  res.json(transactions)
})

router.get('/transactions/:id', (req, res) => {
  const t = transactions.find(x => x.id === Number(req.params.id))
  if (!t) return res.status(404).json({ message: 'Not found' })
  res.json(t)
})

router.post('/transactions', (req, res) => {
  const { items = [], total = 0, email } = req.body
  const t = { id: nextTx++, items, total, email, status: 'created', updatedAt: new Date() }
  transactions.push(t)
  res.status(201).json(t)
})

// Update transaction; notify by email and attach receipt PDF when email provided
router.put('/transactions/:id', checkAdmin, async (req, res) => {
  const t = transactions.find(x => x.id === Number(req.params.id))
  if (!t) return res.status(404).json({ message: 'Not found' })
  t.status = req.body.status ?? t.status
  t.updatedAt = new Date()
  // send email if requested
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

router.delete('/transactions/:id', checkAdmin, (req, res) => {
  const idx = transactions.findIndex(x => x.id === Number(req.params.id))
  if (idx === -1) return res.status(404).json({ message: 'Not found' })
  transactions.splice(idx, 1)
  res.json({ message: 'Deleted' })
})

module.exports = router
