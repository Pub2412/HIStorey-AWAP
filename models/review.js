const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Review = sequelize.define('Review', {
	id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
	user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
	product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
	rating: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
	comment: { type: DataTypes.TEXT, allowNull: true },
	created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
	tableName: 'reviews',
	timestamps: false,
	indexes: [
		{ unique: true, fields: ['user_id', 'product_id'] },
		{ fields: ['product_id'] },
		{ fields: ['user_id'] }
	]
})

module.exports = Review