const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Favorite = sequelize.define('Favorite', {
	id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
	user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
	product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
	created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
	tableName: 'favorites',
	timestamps: false,
	indexes: [
		{ unique: true, fields: ['user_id', 'product_id'] },
		{ fields: ['product_id'] },
		{ fields: ['user_id'] }
	]
})

module.exports = Favorite
