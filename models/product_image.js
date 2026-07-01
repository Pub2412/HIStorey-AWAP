const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const ProductImage = sequelize.define('ProductImage', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  file_path: { type: DataTypes.STRING(500), allowNull: false },
  is_primary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  uploaded_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'product_images',
  timestamps: false
})

module.exports = ProductImage