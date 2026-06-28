const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middlewares/auth')
const userController = require('../controllers/userController')

const {checkAdmin } = require('../middlewares/auth')

router.get(
    '/users',
    verifyToken,
    checkAdmin,
    userController.listUsers
)

router.patch(
    '/users/:id/role',
    verifyToken,
    checkAdmin,
    userController.updateRole
)

router.patch(
    '/users/:id/deactivate',
    verifyToken,
    checkAdmin,
    userController.deactivateUser
)

router.patch(
    '/users/:id/reactivate',
    verifyToken,
    checkAdmin,
    userController.reactivateUser
)


router.post('/auth/register', userController.register)
router.post('/auth/login', userController.login)
router.get('/auth/me', verifyToken, userController.getMe)
router.post('/auth/logout', verifyToken, userController.logout)

module.exports = router
