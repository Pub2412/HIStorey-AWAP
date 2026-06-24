const bcrypt = require('bcrypt')
const { signToken } = require('../middlewares/auth')

let UserModel = null
let useDb = false

const demoUsers = [
	{ id: 1, name: 'Demo User', email: 'demo@historey.com', password: 'Demo@1234', role: 'customer' },
	{ id: 2, name: 'HIStorey Admin', email: 'admin@historey.com', password: 'Admin@1234', role: 'admin' }
]

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

async function ensureDemoUsers() {
	if (!useDb || !UserModel) return

	const seeds = [
		{ name: 'Demo User', email: 'demo@historey.com', password: 'Demo@1234', role: 'customer' },
		{ name: 'HIStorey Admin', email: 'admin@historey.com', password: 'Admin@1234', role: 'admin' }
	]

	for (const seed of seeds) {
		const existing = await UserModel.findOne({ where: { email: seed.email } })
		if (existing) continue

		const password_hash = await bcrypt.hash(seed.password, 10)
		await UserModel.create({
			name: seed.name,
			email: seed.email,
			password_hash,
			role: seed.role,
			is_active: true
		})
		console.log(`Seeded demo user: ${seed.email}`)
	}
}

try {
	const User = require('../models/user')
	const sequelize = require('../config/database')

	sequelize.authenticate().then(async () => {
		useDb = true
		UserModel = User
		await ensureDemoUsers()
		console.log('Database available: users will use database')
	}).catch((err) => {
		console.warn('Database not available, using in-memory users:', err.message)
	})
} catch (err) {
	console.warn('Sequelize user model not found, using in-memory users')
}

async function listUsers(req, res) {
	if (useDb && UserModel) {
		try {
			const users = await UserModel.findAll({
				where: { is_active: true },
				attributes: ['id', 'name', 'email', 'role']
			})
			return res.json(users)
		} catch (err) {
			console.error(err)
			return res.status(500).json({ message: 'DB error' })
		}
	}

	res.json(demoUsers.map((user) => publicUser(user)))
}

async function register(req, res) {
	const name = String(req.body.name || '').trim()
	const email = String(req.body.email || '').trim().toLowerCase()
	const password = String(req.body.password || '')

	if (name.length < 2) {
		return res.status(400).json({ message: 'Enter a valid name to create your account.' })
	}

	if (!isValidEmail(email)) {
		return res.status(400).json({ message: 'Enter a valid email address.' })
	}

	if (password.length < 8) {
		return res.status(400).json({ message: 'Password must be at least 8 characters long.' })
	}

	if (useDb && UserModel) {
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
				role: 'customer',
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

	const existing = demoUsers.find((user) => user.email.toLowerCase() === email)
	if (existing) {
		return res.status(409).json({ message: 'An account already exists for that email address.' })
	}

	const nextUser = {
		id: demoUsers.length ? Math.max(...demoUsers.map((user) => user.id)) + 1 : 1,
		name,
		email,
		password,
		role: 'customer'
	}
	demoUsers.push(nextUser)
	const token = signToken(nextUser)

	return res.status(201).json({
		message: 'Account created successfully.',
		user: publicUser(nextUser),
		token
	})
}

async function login(req, res) {
	const email = String(req.body.email || '').trim().toLowerCase()
	const password = String(req.body.password || '')

	if (!email || !password) {
		return res.status(400).json({ message: 'Email and password are required.' })
	}

	if (useDb && UserModel) {
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

	const user = demoUsers.find((entry) => entry.email.toLowerCase() === email)
	if (!user) {
		return res.status(401).json({ message: 'No account matches that email address.' })
	}

	if (user.password !== password) {
		return res.status(401).json({ message: 'Password is incorrect.' })
	}

	const token = signToken(user)
	return res.json({
		message: 'Signed in successfully.',
		user: publicUser(user),
		token
	})
}

async function getMe(req, res) {
	if (useDb && UserModel) {
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

	const user = demoUsers.find((entry) => entry.id === req.user.id)
	if (!user) {
		return res.status(401).json({ message: 'Session is no longer valid.' })
	}

	return res.json({ user: publicUser(user) })
}

async function logout(req, res) {
	if (useDb && UserModel) {
		try {
			const user = await UserModel.findByPk(req.user.id)
			if (user) {
				await user.update({ active_token: null })
			}
		} catch (err) {
			console.error(err)
		}
	}

	return res.json({ message: 'Signed out successfully.' })
}

module.exports = {
	listUsers,
	register,
	login,
	getMe,
	logout
}
