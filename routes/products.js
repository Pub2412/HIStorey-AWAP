const express = require('express')
const router = express.Router()
const { checkAdmin } = require('../middlewares/auth')
let ProductModel = null
let useDb = false

// in-memory fallback
const products = []
let nextId = 1

// try to load Sequelize model
try {
  const Product = require('../models/product')
  const sequelize = require('../config/database')
  // authenticate in background
  sequelize.authenticate().then(() => {
    useDb = true
    ProductModel = Product
    console.log('Database available: products will use database')
  }).catch(err => {
    console.warn('Database not available, using in-memory products:', err.message)
  })
} catch (err) {
  console.warn('Sequelize product model not found, using in-memory products')
}

router.get('/products', async (req, res) => {
  const q = (req.query.q || '').toLowerCase()
  if (useDb && ProductModel) {
    const where = { is_deleted: false }
    if (q) where[Symbol.for('sqlWhere')] = true // placeholder
    try {
      const all = await ProductModel.findAll({ where: q ? sequelizeWhere(q) : { is_deleted: false } })
      return res.json(all)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'DB error' })
    }
  }
  if (q) {
    const filtered = products.filter(p => p.name.toLowerCase().includes(q))
    return res.json(filtered)
  }
  res.json(products)
})

router.get('/products/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (useDb && ProductModel) {
    const p = await ProductModel.findByPk(id)
    if (!p || p.is_deleted) return res.status(404).json({ message: 'Not found' })
    return res.json(p)
  }
  const p = products.find(x => x.id === id)
  if (!p) return res.status(404).json({ message: 'Not found' })
  res.json(p)
})

router.post('/products', checkAdmin, async (req, res) => {
  const { name, price, category = 'General' } = req.body
  if (useDb && ProductModel) {
    try {
      const created = await ProductModel.create({ name, price, category })
      return res.status(201).json(created)
    } catch (err) { return res.status(500).json({ message: 'DB create error' }) }
  }
  const p = { id: nextId++, name: name || 'Untitled', price: price || 0 }
  products.push(p)
  res.status(201).json(p)
})

router.put('/products/:id', checkAdmin, async (req, res) => {
  const id = Number(req.params.id)
  if (useDb && ProductModel) {
    try {
      const p = await ProductModel.findByPk(id)
      if (!p || p.is_deleted) return res.status(404).json({ message: 'Not found' })
      await p.update(req.body)
      return res.json(p)
    } catch (err) { return res.status(500).json({ message: 'DB update error' }) }
  }
  const p = products.find(x => x.id === id)
  if (!p) return res.status(404).json({ message: 'Not found' })
  p.name = req.body.name ?? p.name
  p.price = req.body.price ?? p.price
  res.json(p)
})

router.delete('/products/:id', checkAdmin, async (req, res) => {
  const id = Number(req.params.id)
  if (useDb && ProductModel) {
    try {
      const p = await ProductModel.findByPk(id)
      if (!p) return res.status(404).json({ message: 'Not found' })
      // soft delete
      await p.update({ is_deleted: true })
      return res.json({ message: 'Deleted' })
    } catch (err) { return res.status(500).json({ message: 'DB delete error' }) }
  }
  const idx = products.findIndex(x => x.id === id)
  if (idx === -1) return res.status(404).json({ message: 'Not found' })
  products.splice(idx, 1)
  res.json({ message: 'Deleted' })
})

// helper for basic search using Sequelize
function sequelizeWhere(q) {
  return {
    [require('sequelize').Op.or]: [
      { name: { [require('sequelize').Op.like]: `%${q}%` } },
      { description: { [require('sequelize').Op.like]: `%${q}%` } }
    ],
    is_deleted: false
  }
}

module.exports = router
