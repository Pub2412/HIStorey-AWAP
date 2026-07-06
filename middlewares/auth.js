const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'historey-dev-secret'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

function signToken(user) {
	return jwt.sign(
		{ id: user.id, email: user.email, role: user.role },
		JWT_SECRET,
		{ expiresIn: JWT_EXPIRES_IN }
	)
}

function verifyToken(req, res, next) {
	const header = req.headers.authorization || ''
	const token = header.startsWith('Bearer ') ? header.slice(7) : null
	if (!token) {
		return res.status(401).json({ message: 'Authentication required' })
	}

	try {
		req.user = jwt.verify(token, JWT_SECRET)
		req.authToken = token
		return next()
	} catch (error) {
		return res.status(401).json({ message: 'Invalid or expired token' })
	}
}

function checkAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }

    	next();
}

module.exports = {
	checkAdmin,
	signToken,
	verifyToken,
	JWT_SECRET,
}