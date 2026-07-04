const sequelize = require('../config/database')
let ProductModel = null
let useDb = false

const ProductImage = require('../models/product_image')
const ReviewModel = require('../models/review')
const UserModel = require('../models/user')
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
  if (filePath.startsWith('/')) return filePath
  if (filePath.startsWith('uploads/')) return `/${filePath}`
  if (filePath.startsWith('images/')) return `/${filePath}`
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

function mapReview(instance) {
  if (!instance) return null
  const obj = instance.toJSON ? instance.toJSON() : instance
  return {
  id: obj.id,
  user_id: obj.user_id,
  product_id: obj.product_id,
  rating: obj.rating,
  comment: obj.comment,
  created_at: obj.created_at,
  user: obj.User || obj.user || null
  }
}

function normalizeProductPayload(body) {
  return {
    name: String(body.name || '').trim(),
    price: Number(body.price ?? 0),
    category: String(body.category || 'General').trim() || 'General',
    description: String(body.description || '').trim(),
    stock: Number.isFinite(Number(body.stock)) ? Math.max(0, Number(body.stock)) : 0,
    condition: String(body.condition || 'Good').trim() || 'Good',
    year: body.year === '' || body.year == null ? null : Number(body.year)
  }
}

exports.listProducts = async (req, res) => {
  const q = (req.query.q || '').toLowerCase()
  if (useDb && ProductModel) {
    try {
      const all = await ProductModel.findAll({
        where: q ? sequelizeWhere(q) : {  },
        order: [['id', 'DESC']],
        include: [{ model: ProductImage, as: 'images', attributes: ['id','file_path','is_primary','uploaded_at'] }]
      })
      const mapped = all.map(mapProduct)
      return res.json(mapped)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'DB error' })
    }
  }
  if (q) return res.json(products.filter(p => p.name.toLowerCase().includes(q) && !p.is_deleted))
  res.json(products.filter(p => !p.is_deleted))
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

exports.listProductReviews = async (req, res) => {
  if (!useDb || !ProductModel || !ReviewModel || !UserModel) {
    return res.status(503).json({ message: 'Database is not available.' })
  }

  const id = Number(req.params.id)
  try {
    const reviews = await ReviewModel.findAll({
      where: { product_id: id },
      include: [{ model: UserModel, attributes: ['id', 'name', 'role'] }],
      order: [['created_at', 'DESC']]
    })

    return res.json(reviews.map(mapReview))
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'DB error' })
  }
}

exports.createProductReview = async (req, res) => {
  if (!useDb || !ProductModel || !ReviewModel || !UserModel) {
    return res.status(503).json({ message: 'Database is not available.' })
  }

  const productId = Number(req.params.id)
  const rating = Number(req.body.rating)
  const comment = String(req.body.comment || '').trim()

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5.' })
  }

  try {
    const product = await ProductModel.findByPk(productId)
    if (!product || product.is_deleted) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    const user = await UserModel.findByPk(req.user.id)
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Session is no longer valid.' })
    }

    if (String(user.role).toLowerCase() !== 'customer') {
      return res.status(403).json({ message: 'Only customer accounts can submit reviews.' })
    }

    const existingReview = await ReviewModel.findOne({ where: { user_id: user.id, product_id: productId } })
    if (existingReview) {
      return res.status(409).json({ message: 'You have already reviewed this product.' })
    }

    const review = await ReviewModel.create({
      user_id: user.id,
      product_id: productId,
      rating,
      comment
    })

    const created = await ReviewModel.findByPk(review.id, {
      include: [{ model: UserModel, attributes: ['id', 'name', 'role'] }]
    })

    return res.status(201).json(mapReview(created))
  } catch (err) {
    if (err && err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'You have already reviewed this product.' })
    }
    console.error(err)
    return res.status(500).json({ message: 'Could not save review.' })
  }
}

exports.createProduct = async (req, res) => {
  const payload = normalizeProductPayload(req.body)
  if (useDb && ProductModel) {
    try {
      const created = await ProductModel.create(payload)
      return res.status(201).json(created)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'DB create error' })
    }
  }
  const p = {
    id: nextId++,
    name: payload.name || 'Untitled',
    price: payload.price || 0,
    category: payload.category,
    description: payload.description,
    stock: payload.stock,
    condition: payload.condition,
    year: payload.year,
    is_deleted: false,
    images: []
  }
  products.push(p)
  res.status(201).json(p)
}

exports.updateProduct = async (req, res) => {
  const id = Number(req.params.id)
  const payload = normalizeProductPayload(req.body)
  if (useDb && ProductModel) {
    try {
      const p = await ProductModel.findByPk(id)
      if (!p || p.is_deleted) return res.status(404).json({ message: 'Not found' })
      await p.update({
        name: payload.name || p.name,
        price: Number.isFinite(payload.price) ? payload.price : p.price,
        category: payload.category || p.category,
        description: payload.description !== '' ? payload.description : p.description,
        stock: Number.isFinite(payload.stock) ? payload.stock : p.stock,
        condition: payload.condition || p.condition,
        year: req.body.year === undefined || req.body.year === '' ? p.year : payload.year
      })
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
  p.name = payload.name || p.name
  p.price = Number.isFinite(payload.price) ? payload.price : p.price
  p.category = payload.category || p.category
  p.description = payload.description !== '' ? payload.description : p.description
  p.stock = Number.isFinite(payload.stock) ? payload.stock : p.stock
  p.condition = payload.condition || p.condition
  p.year = req.body.year === undefined || req.body.year === '' ? p.year : payload.year
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
  if (useDb && ProductModel && ProductImage) {
    try {
      const p = await ProductModel?.findByPk(id)
      if (!p) return res.status(404).json({ message: 'Product not found' })

      const created = []
      for (const f of req.files) {
        const publicPath = `/uploads/products/${f.filename}`
        const img = await ProductImage.create({ product_id: id, file_path: publicPath, is_primary: false })
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

  if (useDb && ProductModel && ProductImage) {
    try {
      const img = await ProductImage.findOne({ where: { id: imageId, product_id: productId } })
      if (!img) return res.status(404).json({ message: 'Image not found' })

      const filePathRelative = img.file_path.replace(/^\//, '') // remove leading slash
      const diskPath = path.join(__dirname, '..', 'public', filePathRelative)
      if (fs.existsSync(diskPath)) {
        try { fs.unlinkSync(diskPath) } catch (e) { console.warn('Could not delete file', e.message) }
      }

      await img.destroy()

      if (img.is_primary) {
        const replacement = await ProductImage.findOne({
          where: { product_id: productId },
          order: [['uploaded_at', 'ASC'], ['id', 'ASC']]
        })
        if (replacement) {
          await replacement.update({ is_primary: true })
        }
      }

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

  if (!ProductImage || !useDb || !ProductModel) {
    const product = products.find(x => x.id === productId)
    if (!product || !Array.isArray(product.images)) {
      return res.status(404).json({ message: 'Image not found' })
    }

    const target = product.images.find(image => Number(image.id) === imageId)
    if (!target) {
      return res.status(404).json({ message: 'Image not found' })
    }

    product.images = product.images.map(image => ({
      ...image,
      is_primary: Number(image.id) === imageId
    }))

    return res.json({
      message: 'Primary image set',
      image: {
        id: target.id,
        file_path: target.file_path,
        is_primary: true,
        url: target.url || toImageUrl(target.file_path)
      }
    })
  }

  try {
    const product = await ProductModel.findByPk(productId)
    if (!product) return res.status(404).json({ message: 'Product not found' })

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