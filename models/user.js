const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const User = sequelize.define('User', {
	id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
	name: { type: DataTypes.STRING(150), allowNull: false },
	email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
	password_hash: { type: DataTypes.STRING(255), allowNull: false },
	role: { type: DataTypes.ENUM('customer', 'admin'), allowNull: false, defaultValue: 'customer' },
	is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
	active_token: { type: DataTypes.TEXT, allowNull: true },
	profile_photo: { type: DataTypes.STRING(500), allowNull: true },
	phone: { type: DataTypes.STRING(30), allowNull: true },
	address: { type: DataTypes.TEXT, allowNull: true }
}, {
	tableName: 'users',
	timestamps: true,
	createdAt: 'created_at',
	updatedAt: 'updated_at'
})

module.exports = User
