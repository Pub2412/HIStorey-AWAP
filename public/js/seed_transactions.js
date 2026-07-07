const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    const users = await sequelize.query('SELECT id, name, role FROM users', { type: QueryTypes.SELECT });
    console.log(`Found ${users.length} users.`);

    const products = await sequelize.query('SELECT id, name, price FROM products WHERE is_deleted = 0', { type: QueryTypes.SELECT });
    console.log(`Found ${products.length} products.`);

    const transactions = await sequelize.query('SELECT id FROM transactions', { type: QueryTypes.SELECT });
    console.log(`Found ${transactions.length} existing transactions.`);

    if (transactions.length === 0) {
      console.log('No transactions found. Seeding sample transactions...');

      const customers = users.filter(u => u.role === 'customer');
      if (customers.length === 0) {
        console.log('No customers found. Creating a sample customer...');
        const [customerResult] = await sequelize.query(
          "INSERT INTO users (name, email, password_hash, role) VALUES ('John Doe', 'john@example.com', 'placeholder', 'customer')",
          { type: QueryTypes.INSERT }
        );
        customers.push({ id: customerResult, name: 'John Doe', role: 'customer' });
      }

      if (products.length === 0) {
        console.log('No products found to purchase. Cannot seed transactions.');
        return;
      }

      const txSamples = [
        {
          userId: customers[0].id,
          status: 'Delivered',
          shippingAddress: '123 Thriller Lane, Gary, Indiana',
          items: [
            { productId: products[0].id, quantity: 2, price: products[0].price },
            { productId: products[Math.min(1, products.length - 1)].id, quantity: 1, price: products[Math.min(1, products.length - 1)].price }
          ]
        },
        {
          userId: customers[0].id,
          status: 'Processing',
          shippingAddress: '456 Neverland Ranch, Los Olivos, California',
          items: [
            { productId: products[Math.min(2, products.length - 1)].id, quantity: 5, price: products[Math.min(2, products.length - 1)].price }
          ]
        },
        {
          userId: customers[0].id,
          status: 'Pending',
          shippingAddress: '789 Motown Blvd, Detroit, Michigan',
          items: [
            { productId: products[0].id, quantity: 1, price: products[0].price },
            { productId: products[Math.min(3, products.length - 1)].id, quantity: 3, price: products[Math.min(3, products.length - 1)].price }
          ]
        }
      ];

      for (const tx of txSamples) {
        let totalAmount = 0;
        for (const item of tx.items) {
          totalAmount += Number(item.price) * item.quantity;
        }

        const [txId] = await sequelize.query(
          'INSERT INTO transactions (user_id, status) VALUES (:userId, :status)',
          {
            replacements: { userId: tx.userId, status: tx.status },
            type: QueryTypes.INSERT
          }
        );

        for (const item of tx.items) {
          await sequelize.query(
            'INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price) VALUES (:txId, :productId, :quantity, :price)',
            {
              replacements: { txId, productId: item.productId, quantity: item.quantity, price: item.price },
              type: QueryTypes.INSERT
            }
          );
        }
        console.log(`Created transaction ID ${txId} with total ${totalAmount}`);
      }
      console.log('Seeding completed successfully!');
    } else {
      console.log('Transactions already exist, seeding skipped.');
    }
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    await sequelize.close();
  }
}

run();
