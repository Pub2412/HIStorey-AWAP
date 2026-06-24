const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middlewares/auth')
const userController = require('../controllers/userController')

router.get('/users', userController.listUsers)
router.post('/auth/register', userController.register)
router.post('/auth/login', userController.login)
router.get('/auth/me', verifyToken, userController.getMe)
router.post('/auth/logout', verifyToken, userController.logout)

module.exports = router
