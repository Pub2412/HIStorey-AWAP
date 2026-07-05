const path = require('path')
const multer = require('multer')
const fs = require('fs')

const baseUploadDir = path.join(__dirname, '..', 'public', 'uploads')
const productDir = path.join(baseUploadDir, 'products')
const userDir = path.join(baseUploadDir, 'users')

if (!fs.existsSync(productDir)) fs.mkdirSync(productDir, { recursive: true })
if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true })

const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`
    cb(null, name)
  }
})

const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, userDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`
    cb(null, name)
  }
})

const productUpload = multer({ storage: productStorage })
const userUpload = multer({ storage: userStorage })

// Default export kept for backwards compatibility (products routes)
module.exports = productUpload
module.exports.userUpload = userUpload