const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Create a Mailtrap transporter for sending emails
 */
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || 'smtp.mailtrap.io',
  port: process.env.MAILTRAP_PORT || 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
  secure: false, // true for 465, false for other ports like 2525
});

/**
 * Send a transaction receipt email with PDF attachment
 * @param {Object} transaction - Transaction object with id, email, items, total, status
 * @param {Buffer} pdfBuffer - PDF buffer for the receipt
 * @returns {Promise<Object>} - Nodemailer response
 */
async function sendReceiptEmail(transaction, pdfBuffer) {
  if (!transaction.email) {
    throw new Error('Transaction email is required');
  }

  try {
    const subject = transaction.isUpdate
      ? `Receipt Updated for Order #${transaction.id} - HIStorey`
      : `Receipt for Order #${transaction.id} - HIStorey`;

    const mailOptions = {
      from: process.env.MAILTRAP_FROM_EMAIL || 'receipt@historey.com',
      to: transaction.email,
      subject: subject,
      html: generateEmailHTML(transaction),
      attachments: [
        {
          filename: `Receipt_${transaction.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    await logEmailStatus(transaction.id, transaction.email, subject, 'sent', 1);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    const subject = transaction.isUpdate
      ? `Receipt Updated for Order #${transaction.id} - HIStorey`
      : `Receipt for Order #${transaction.id} - HIStorey`;
    await logEmailStatus(transaction.id, transaction.email, subject, 'failed', 1);
    throw error;
  }
}

async function logEmailStatus(transactionId, recipientEmail, subject, status, hasAttachment = 1) {
  try {
    const sequelize = require('../config/database');
    const { QueryTypes } = require('sequelize');
    await sequelize.query(
      'INSERT INTO email_logs (transaction_id, recipient, subject, status, has_attachment) VALUES (:transactionId, :recipientEmail, :subject, :status, :hasAttachment)',
      {
        replacements: {
          transactionId,
          recipientEmail,
          subject,
          status,
          hasAttachment
        },
        type: QueryTypes.INSERT
      }
    );
    console.log(`Log written to email_logs for transaction #${transactionId} (${status})`);
  } catch (logError) {
    console.error('Failed to write to email_logs:', logError.message);
  }
}

/**
 * Generate HTML email template for transaction receipt
 * @param {Object} transaction - Transaction object
 * @returns {string} - HTML content
 */
function generateEmailHTML(transaction) {
  const itemsHTML = (transaction.items || [])
    .map(
      (item) => {
        const name = item.name || item.product_name || 'Product';
        const qty = Number(item.qty || item.quantity || 1);
        const price = Number(item.price || item.unit_price || 0);
        const subtotal = price * qty;
        return `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">×${qty}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">PHP ${price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">PHP ${subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
    </tr>
  `;
      }
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${transaction.isUpdate ? 'Receipt Updated - HIStorey' : 'Order Receipt'}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            background-color: #f9f9f9;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            color: #000;
            font-size: 24px;
          }
          .order-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .info-item {
            flex: 1;
          }
          .info-item strong {
            display: block;
            color: #666;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .info-item span {
            display: block;
            font-size: 14px;
            color: #000;
          }
          table {
            width: 100%;
            margin: 20px 0;
            border-collapse: collapse;
          }
          table thead tr {
            background-color: #f0f0f0;
          }
          table thead th {
            padding: 10px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid #ddd;
          }
          .summary {
            margin: 20px 0;
            text-align: right;
          }
          .summary-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 8px;
            padding: 5px 0;
          }
          .summary-row-label {
            flex: 0 0 150px;
            text-align: right;
            margin-right: 10px;
          }
          .summary-row-value {
            flex: 0 0 100px;
            text-align: right;
            font-weight: bold;
          }
          .summary-total {
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 10px;
            font-size: 18px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 12px;
          }
          .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-created {
            background-color: #e3f2fd;
            color: #1976d2;
          }
          .status-processing {
            background-color: #fff3e0;
            color: #f57c00;
          }
          .status-shipped {
            background-color: #e8f5e9;
            color: #388e3c;
          }
          .status-completed {
            background-color: #f3e5f5;
            color: #7b1fa2;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>HIStorey</h1>
            <p>Michael Jackson Memorabilia Store</p>
            <p style="color: #999; font-size: 14px; margin: 5px 0 0 0;">${transaction.isUpdate ? `Receipt Updated for Order #${transaction.id} - HIStorey` : 'Order Receipt'}</p>
          </div>

          <div class="order-info">
            <div class="info-item">
              <strong>Order ID</strong>
              <span>#${transaction.id}</span>
            </div>
            <div class="info-item">
              <strong>Order Date</strong>
              <span>${new Date(transaction.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
            <div class="info-item">
              <strong>Status</strong>
              <span><span class="status-badge status-${transaction.status || 'created'}">${(transaction.status || 'created').charAt(0).toUpperCase() + (transaction.status || 'created').slice(1)}</span></span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row">
              <div class="summary-row-label">Subtotal:</div>
              <div class="summary-row-value">PHP ${Number(transaction.total || transaction.total_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="summary-row">
              <div class="summary-row-label">Shipping:</div>
              <div class="summary-row-value">FREE</div>
            </div>
            <div class="summary-row summary-total">
              <div class="summary-row-label">Total:</div>
              <div class="summary-row-value">PHP ${Number(transaction.total || transaction.total_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>For support, contact us at support@historey.com</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send a simple email (generic use)
 * @param {Object} options - Email options {to, subject, html}
 * @returns {Promise<Object>} - Nodemailer response
 */
async function sendEmail(options) {
  try {
    const mailOptions = {
      from: process.env.MAILTRAP_FROM_EMAIL || 'noreply@historey.com',
      ...options,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

module.exports = {
  sendReceiptEmail,
  sendEmail,
  transporter,
  generateEmailHTML,
};
