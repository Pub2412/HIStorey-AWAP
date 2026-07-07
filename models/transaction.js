const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define(
  'Transaction',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('created', 'processing', 'shipped', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'created',
    },
    payment_status: {
      type: DataTypes.ENUM('Pending', 'Paid', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Pending',
    },
    payment_method: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    receipt_sent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    receipt_sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Transaction;
