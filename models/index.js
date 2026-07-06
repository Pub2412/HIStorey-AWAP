const Product = require('./product');
const Transaction = require('./transaction');
const TransactionItem = require('./transaction_item');
const CartItem = require('./cart_item');
const EmailLog = require('./email_log');

// Define relationships
Transaction.hasMany(TransactionItem, {
  foreignKey: 'transaction_id',
  as: 'items',
});
TransactionItem.belongsTo(Transaction, {
  foreignKey: 'transaction_id',
});

Transaction.hasMany(EmailLog, {
  foreignKey: 'transaction_id',
  as: 'email_logs',
});
EmailLog.belongsTo(Transaction, {
  foreignKey: 'transaction_id',
});

TransactionItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});

CartItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});

module.exports = {
  Product,
  Transaction,
  TransactionItem,
  CartItem,
  EmailLog,
};
