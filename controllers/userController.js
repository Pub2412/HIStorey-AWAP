const bcrypt = require('bcrypt')
const { signToken } = require('../middlewares/auth')

let UserModel = null
let useDb = false

function publicUser(user) {
	return {
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role || 'customer'
	}
}

function isValidEmail(email) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function requireDatabase(res) {
	if (!useDb || !UserModel) {
		res.status(503).json({ message: 'Database is not available.' })
		return false
	}
	return true
}

try {
	const User = require('../models/user')
	const sequelize = require('../config/database')

	sequelize.authenticate().then(() => {
		useDb = true
		UserModel = User
		console.log('Database available: users will use database')
	}).catch((err) => {
		console.error('Database not available for users:', err.message)
	})
} catch (err) {
	console.error('Sequelize user model not found:', err.message)
}

async function listUsers(req, res) {
	if (!requireDatabase(res)) return

	try {
		const users = await UserModel.findAll({
			attributes: ['id', 'name', 'email', 'role', 'phone', 'is_active', 'created_at']
		})
		return res.json(users)
	} catch (err) {
		console.error(err)
		return res.status(500).json({ message: 'DB error' })
	}
}

async function register(req, res) {
	if (!requireDatabase(res)) return

	const name = String(req.body.name || '').trim()
	const email = String(req.body.email || '').trim().toLowerCase()
	const password = String(req.body.password || '')
	const requestedRole = String(req.body.role || 'customer').toLowerCase()

	if (name.length < 2) {
		return res.status(400).json({ message: 'Enter a valid name to create your account.' })
	}

	if (!isValidEmail(email)) {
		return res.status(400).json({ message: 'Enter a valid email address.' })
	}

	if (password.length < 8) {
		return res.status(400).json({ message: 'Password must be at least 8 characters long.' })
	}

	if (!['customer', 'admin'].includes(requestedRole)) {
		return res.status(400).json({ message: 'Invalid role.' })
	}

	try {
		const existing = await UserModel.findOne({ where: { email } })
		if (existing) {
			return res.status(409).json({ message: 'An account already exists for that email address.' })
		}

		const password_hash = await bcrypt.hash(password, 10)
		const user = await UserModel.create({
			name,
			email,
			password_hash,
			role: requestedRole,
			is_active: true
		})

		const token = signToken(user)
		await user.update({ active_token: token })

		return res.status(201).json({
			message: 'Account created successfully.',
			user: publicUser(user),
			token
		})
	} catch (err) {
		console.error(err)
		return res.status(500).json({ message: 'Could not create account.' })
	}
}

async function login(req, res) {
	if (!requireDatabase(res)) return

	const email = String(req.body.email || '').trim().toLowerCase()
	const password = String(req.body.password || '')

	if (!email || !password) {
		return res.status(400).json({ message: 'Email and password are required.' })
	}

	try {
		const user = await UserModel.findOne({ where: { email } })
		if (!user) {
			return res.status(401).json({ message: 'No account matches that email address.' })
		}

		if (!user.is_active) {
			return res.status(403).json({ message: 'This account has been deactivated.' })
		}

		const valid = await bcrypt.compare(password, user.password_hash)
		if (!valid) {
			return res.status(401).json({ message: 'Password is incorrect.' })
		}

		const token = signToken(user)
		await user.update({ active_token: token })

		return res.json({
			message: 'Signed in successfully.',
			user: publicUser(user),
			token
		})
	} catch (err) {
		console.error(err)
		return res.status(500).json({ message: 'Could not sign in.' })
	}
}

async function getMe(req, res) {
	if (!requireDatabase(res)) return

	try {
		const user = await UserModel.findByPk(req.user.id)
		if (!user || !user.is_active) {
			return res.status(401).json({ message: 'Session is no longer valid.' })
		}

		if (user.active_token !== req.authToken) {
			return res.status(401).json({ message: 'Session expired. Please sign in again.' })
		}

		return res.json({ user: publicUser(user) })
	} catch (err) {
		console.error(err)
		return res.status(500).json({ message: 'Could not load session.' })
	}
}

async function logout(req, res) {
	if (!requireDatabase(res)) return

	try {
		const user = await UserModel.findByPk(req.user.id)
		if (user) {
			await user.update({ active_token: null })
		}
	} catch (err) {
		console.error(err)
	}

	return res.json({ message: 'Signed out successfully.' })
}

async function updateRole(req, res) {
    if (!requireDatabase(res)) return

    try {
        const { id } = req.params
        const { role } = req.body

        // 1. validate role first
        if (!['admin', 'customer'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' })
        }

        // 2. get target user
        const user = await UserModel.findByPk(id)
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        // 3. 🔒 SAFETY CHECK (PUT IT HERE)
        if (Number(req.user.id) === Number(id)) {
			return res.status(403).json({
				message: "You cannot change your own role"
			})
		}

        // 4. update role
        await user.update({ role })

        return res.json({ message: 'Role updated successfully' })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to update role' })
    }
}

async function deactivateUser(req, res) {
    if (!requireDatabase(res)) return

    try {
        const { id } = req.params

        const user = await UserModel.findByPk(id)
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        await user.update({ is_active: false })

        return res.json({ message: 'User deactivated' })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to deactivate user' })
    }
}

async function reactivateUser(req, res) {
    if (!requireDatabase(res)) return

    try {
        const { id } = req.params

        const user = await UserModel.findByPk(id)
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        await user.update({ is_active: true })

        return res.json({ message: 'User reactivated' })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to reactivate user' })
    }
}

module.exports = {
	listUsers,
	register,
	login,
	getMe,
	logout,
	updateRole,
    deactivateUser,
	reactivateUser
}
