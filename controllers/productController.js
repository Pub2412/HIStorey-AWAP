const sequelize = require('../config/database')
let ProductModel = null
let useDb = false

const ProductImage = require('../models/product_image')
const path = require('path')
const fs = require('fs')

// in-memory fallback
const products = []
let nextId = 1

try {
  const Product = require('../models/product')
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

function sequelizeWhere(q) {
  const { Op } = require('sequelize')
  return {
    [Op.or]: [
      { name: { [Op.like]: `%${q}%` } },
      { description: { [Op.like]: `%${q}%` } }
    ],
    is_deleted: false
  }
}

function toImageUrl(filePath) {
  if (!filePath) return ''
  // already absolute path
  if (filePath.startsWith('/')) return filePath
  // legacy relative paths like "uploads/..." or "uploads/products/..."
  if (filePath.startsWith('uploads/')) return `/${filePath}`
  return `/${filePath}`
}

function mapProduct(instance) {
  if (!instance) return null
  const obj = instance.toJSON ? instance.toJSON() : instance
  if (obj.images && Array.isArray(obj.images)) {
    obj.images = obj.images.map(img => ({
      id: img.id,
      file_path: img.file_path,
      is_primary: !!img.is_primary,
      uploaded_at: img.uploaded_at,
      url: toImageUrl(img.file_path)
    }))
  } else {
    obj.images = []
  }
  return obj
}

exports.listProducts = async (req, res) => {
  const q = (req.query.q || '').toLowerCase()
  if (useDb && ProductModel) {
    try {
      const all = await ProductModel.findAll({
        where: q ? sequelizeWhere(q) : { },
        include: [{ model: ProductImage, as: 'images', attributes: ['id','file_path','is_primary','uploaded_at'] }]
      })
      const mapped = all.map(mapProduct)
      return res.json(mapped)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'DB error' })
    }
  }
  if (q) return res.json(products.filter(p => p.name.toLowerCase().includes(q)))
  res.json(products)
}

exports.getProduct = async (req, res) => {
  const id = Number(req.params.id)
  if (useDb && ProductModel) {
    try {
      const p = await ProductModel.findByPk(id, {
        include: [{ model: ProductImage, as: 'images', attributes: ['id','file_path','is_primary','uploaded_at'] }]
      })
      if (!p || p.is_deleted) return res.status(404).json({ message: 'Not found' })
      return res.json(mapProduct(p))
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'DB error' })
    }
  }
  const p = products.find(x => x.id === id)
  if (!p) return res.status(404).json({ message: 'Not found' })
  res.json(p)
}

exports.createProduct = async (req, res) => {
  const { name, price, category = 'General' } = req.body
  if (useDb && ProductModel) {
    try {
      const created = await ProductModel.create({ name, price, category })
      return res.status(201).json(created)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'DB create error' })
    }
  }
  const p = { id: nextId++, name: name || 'Untitled', price: price || 0 }
  products.push(p)
  res.status(201).json(p)
}

exports.updateProduct = async (req, res) => {
  const id = Number(req.params.id)
  if (useDb && ProductModel) {
    try {
      const p = await ProductModel.findByPk(id)
      if (!p || p.is_deleted) return res.status(404).json({ message: 'Not found' })
      await p.update(req.body)
      const updated = await ProductModel.findByPk(id, {
        include: [{ model: ProductImage, as: 'images', attributes: ['id','file_path','is_primary','uploaded_at'] }]
      })
      return res.json(mapProduct(updated))
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'DB update error' })
    }
  }
  const p = products.find(x => x.id === id)
  if (!p) return res.status(404).json({ message: 'Not found' })
  p.name = req.body.name ?? p.name
  p.price = req.body.price ?? p.price
  res.json(p)
}

exports.deleteProduct = async (req, res) => {
  const id = Number(req.params.id)
  if (useDb && ProductModel) {
    try {
      const p = await ProductModel.findByPk(id)
      if (!p) return res.status(404).json({ message: 'Not found' })
      await p.update({ is_deleted: true })
      return res.json({ message: 'Deleted' })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'DB delete error' })
    }
  }
  const idx = products.findIndex(x => x.id === id)
  if (idx === -1) return res.status(404).json({ message: 'Not found' })
  products.splice(idx, 1)
  res.json({ message: 'Deleted' })
}

exports.deactivateProduct = async (req, res) => {
  const id = Number(req.params.id)
  if (useDb && ProductModel) {
    try {
      const p = await ProductModel.findByPk(id)
      if (!p) return res.status(404).json({ message: 'Not found' })
      await p.update({ is_deleted: true })
      return res.json({ message: 'Product deactivated' })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'DB update error' })
    }
  }
  const p = products.find(x => x.id === id)
  if (!p) return res.status(404).json({ message: 'Not found' })
  p.is_deleted = true
  res.json({ message: 'Product deactivated' })
}

exports.reactivateProduct = async (req, res) => {
  const id = Number(req.params.id)
  if (useDb && ProductModel) {
    try {
      const p = await ProductModel.findByPk(id)
      if (!p) return res.status(404).json({ message: 'Not found' })
      await p.update({ is_deleted: false })
      return res.json({ message: 'Product reactivated' })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'DB update error' })
    }
  }
  const p = products.find(x => x.id === id)
  if (!p) return res.status(404).json({ message: 'Not found' })
  p.is_deleted = false
  res.json({ message: 'Product reactivated' })
}

exports.uploadImages = async (req, res) => {
  const id = Number(req.params.id)
  if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files uploaded' })

  // attempt DB write if model available
  if (ProductImage) {
    try {
      const p = await ProductModel?.findByPk(id)
      if (!p) return res.status(404).json({ message: 'Product not found' })

      const created = []
      for (const f of req.files) {
        // store file_path as a public URL path
        const filePath = `/uploads/products/${f.filename}`
        const img = await ProductImage.create({ product_id: id, file_path: filePath, is_primary: false })
        created.push({
          id: img.id,
          file_path: img.file_path,
          is_primary: !!img.is_primary,
          uploaded_at: img.uploaded_at,
          url: toImageUrl(img.file_path)
        })
      }
      return res.status(201).json(created)
    } catch (err) {
      console.error('DB uploadImages error:', err)
      // fall back to in-memory below
    }
  }

  // in-memory fallback (if DB not usable)
  const p = products.find(x => x.id === id)
  if (!p) return res.status(404).json({ message: 'Product not found' })
  p.images = p.images || []
  for (const f of req.files) {
    const img = { id: Date.now() + Math.floor(Math.random()*1000), filename: f.filename, file_path: `/uploads/products/${f.filename}`, url: `/uploads/products/${f.filename}` }
    p.images.push(img)
  }
  res.status(201).json(p.images)
}

exports.deleteImage = async (req, res) => {
  const productId = Number(req.params.id)
  const imageId = Number(req.params.imageId)

  if (ProductImage) {
    try {
      const img = await ProductImage.findOne({ where: { id: imageId, product_id: productId } })
      if (!img) return res.status(404).json({ message: 'Image not found' })

      const filePathRelative = img.file_path.replace(/^\//, '') // remove leading slash
      const diskPath = path.join(__dirname, '..', 'public', filePathRelative)
      if (fs.existsSync(diskPath)) {
        try { fs.unlinkSync(diskPath) } catch (e) { console.warn('Could not delete file', e.message) }
      }

      await img.destroy()
      return res.json({ message: 'Deleted' })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'DB delete error' })
    }
  }

  // in-memory fallback
  const p = products.find(x => x.id === productId)
  if (!p || !p.images) return res.status(404).json({ message: 'Image not found' })
  const idx = p.images.findIndex(i => i.id === imageId)
  if (idx === -1) return res.status(404).json({ message: 'Image not found' })
  p.images.splice(idx, 1)
  res.json({ message: 'Deleted' })
}

exports.getProductImages = async (req, res) => {
  const id = Number(req.params.id)
  if (useDb && ProductModel) {
    try {
      const p = await ProductModel.findByPk(id, { include: [{ model: ProductImage, as: 'images', attributes: ['id','file_path','is_primary','uploaded_at'] }] })
      if (!p) return res.status(404).json({ message: 'Not found' })
      const mapped = (p.images || []).map(img => ({
        id: img.id,
        file_path: img.file_path,
        is_primary: !!img.is_primary,
        uploaded_at: img.uploaded_at,
        url: toImageUrl(img.file_path)
      }))
      return res.json(mapped)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'DB error' })
    }
  }
  const p = products.find(x => x.id === id)
  if (!p) return res.status(404).json({ message: 'Not found' })
  res.json(p.images)
}

exports.setPrimaryImage = async (req, res) => {
  const productId = Number(req.params.id)
  const imageId = Number(req.params.imageId)

  try {
    const img = await ProductImage.findOne({ where: { id: imageId, product_id: productId } })
    if (!img) return res.status(404).json({ message: 'Image not found' })

    const t = await sequelize.transaction()
    try {
      await ProductImage.update({ is_primary: false }, { where: { product_id: productId }, transaction: t })
      await img.update({ is_primary: true }, { transaction: t })
      await t.commit()
    } catch (err) {
      await t.rollback()
      throw err
    }

    const updated = await ProductImage.findOne({ where: { id: imageId } })
    return res.json({ message: 'Primary image set', image: { id: updated.id, file_path: updated.file_path, is_primary: !!updated.is_primary, url: toImageUrl(updated.file_path) } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not set primary image' })
  }
}