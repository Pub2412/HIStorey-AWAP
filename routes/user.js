const express = require('express')
const router = express.Router()

// Simple demo users list (no auth)
const users = [ { id:1, name:'Admin', role: 'admin' }, { id:2, name:'Customer', role:'user' } ]

router.get('/users', (req, res) => res.json(users))

module.exports = router
