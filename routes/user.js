const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middlewares/auth')
const userController = require('../controllers/userController')

const {checkAdmin } = require('../middlewares/auth')
const upload = require('../utils/multer')

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


router.post('/auth/register', upload.userUpload ? upload.userUpload.single('profile_photo') : upload.single('profile_photo'), userController.register)
router.post('/auth/login', userController.login)
router.get('/auth/me', verifyToken, userController.getMe)
router.post('/auth/logout', verifyToken, userController.logout)

// Update current user's profile (phone, address, name, photo)
router.patch('/auth/me', verifyToken, upload.userUpload ? upload.userUpload.single('profile_photo') : upload.single('profile_photo'), userController.updateMe)

router.get('/auth/me/favorites', verifyToken, userController.getMyFavorites)

module.exports = router
