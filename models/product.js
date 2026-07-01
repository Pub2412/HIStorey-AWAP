const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT },
  category: { type: DataTypes.STRING(100), allowNull: false },
  price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  stock: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  condition: { type: DataTypes.ENUM('New','Like New','Good','Fair','Poor'), allowNull: false, defaultValue: 'Good' },
  year: { type: DataTypes.INTEGER },
  is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})

module.exports = Product

// associate images (ensure this runs on startup)
try {
  const ProductImage = require('./product_image')
  Product.hasMany(ProductImage, { as: 'images', foreignKey: 'product_id' })
  ProductImage.belongsTo(Product, { foreignKey: 'product_id' })
} catch (e) {
  // model may not exist yet during some tooling runs — ignore
}