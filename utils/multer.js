const path = require('path')
const multer = require('multer')
const fs = require('fs')

const baseUploadDir = path.join(__dirname, '..', 'public', 'uploads')
const productDir = path.join(baseUploadDir, 'products')

if (!fs.existsSync(productDir)) fs.mkdirSync(productDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`
    cb(null, name)
  }
})

module.exports = multer({ storage })