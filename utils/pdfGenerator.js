const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate PDF receipt for a transaction
 * @param {Object} transaction - Transaction object with id, email, items, total, status
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generateReceiptPDF(transaction) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('HIStorey', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text('Michael Jackson Memorabilia Store', { align: 'center' });
      doc.fontSize(10).fillColor('#999').text(transaction.isUpdate ? `Receipt Updated for Order #${transaction.id} - HIStorey` : 'Receipt', { align: 'center' });
      doc.moveDown(0.5);

      // Horizontal line
      doc.strokeColor('#000').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      // Order information
      const pageWidth = doc.page.width - 80; // 40px margins on each side
      const colWidth = pageWidth / 3;

      doc.fontSize(10).fillColor('#000');

      // Order ID
      doc.font('Helvetica-Bold').text('Order ID', 40, doc.y);
      doc.font('Helvetica').text(`#${transaction.id}`, 40, doc.y);

      // Order Date
      const dateStr = new Date(transaction.createdAt || Date.now()).toLocaleDateString();
      doc.font('Helvetica-Bold').text('Order Date', 40 + colWidth, doc.y - 25);
      doc.font('Helvetica').text(dateStr, 40 + colWidth, doc.y);

      // Status
      const statusStr = (transaction.status || 'created').charAt(0).toUpperCase() + (transaction.status || 'created').slice(1);
      doc.font('Helvetica-Bold').text('Status', 40 + 2 * colWidth, doc.y - 25);
      doc.font('Helvetica').text(statusStr, 40 + 2 * colWidth, doc.y);

      doc.moveDown(1.5);

      // Horizontal line
      doc.strokeColor('#ccc').lineWidth(0.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      // Items table header
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000');
      doc.text('Product', 40, doc.y);
      doc.text('Qty', 350, doc.y, { width: 50, align: 'center' });
      doc.text('Unit Price', 410, doc.y, { width: 70, align: 'right' });
      doc.text('Subtotal', 480, doc.y, { width: 70, align: 'right' });

      doc.fontSize(9);
      doc.moveDown(0.5);

      // Horizontal line
      doc.strokeColor('#ccc').lineWidth(0.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);

      // Items
      doc.font('Helvetica').fillColor('#000');
      let yPosition = doc.y;

      const items = transaction.items || [];
      items.forEach((item, index) => {
        const quantity = item.qty || item.quantity || 1;
        const price = parseFloat(item.price || item.unit_price) || 0;
        const subtotal = price * quantity;

        doc.fontSize(9);
        doc.text(item.name || item.product_name || 'Product', 40, yPosition, { width: 300 });
        doc.text(quantity.toString(), 350, yPosition - 9, { width: 50, align: 'center' });
        doc.text(`PHP ${price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, 410, yPosition - 9, { width: 70, align: 'right' });
        doc.text(`PHP ${subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, 480, yPosition - 9, { width: 70, align: 'right' });

        yPosition = doc.y;
        doc.moveDown(0.3);
      });

      // Horizontal line
      doc.strokeColor('#ccc').lineWidth(0.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      // Summary section
      doc.fontSize(10);
      const summaryX = 350;
      const totalAmount = Number(transaction.total || transaction.total_amount || 0);

      doc.font('Helvetica').text('Subtotal:', summaryX, doc.y);
      doc.text(`PHP ${totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, 410, doc.y - 9, { width: 140, align: 'right' });

      doc.moveDown(0.5);
      doc.text('Shipping:', summaryX, doc.y);
      doc.text('FREE', 410, doc.y - 9, { width: 140, align: 'right' });

      doc.moveDown(0.5);

      // Horizontal line
      doc.strokeColor('#000').lineWidth(1).moveTo(summaryX, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);

      // Total
      doc.font('Helvetica-Bold').fontSize(12).text('Total:', summaryX, doc.y);
      doc.text(`PHP ${totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, 410, doc.y - 12, { width: 140, align: 'right' });

      doc.moveDown(1.5);

      // Footer
      doc.fontSize(9).fillColor('#666').font('Helvetica');
      doc.text('Thank you for your purchase!', { align: 'center' });
      doc.text('Michael Jackson Memorabilia Store', { align: 'center' });
      doc.text('support@historey.com', { align: 'center' });

      doc.moveDown(0.5);

      // Page numbers
      const pages = doc.bufferedPageRange().count;
      for (let i = 0; i < pages; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#999').text(`Page ${i + 1} of ${pages}`, 40, doc.page.height - 30, { align: 'center' });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Save PDF to file (for development/testing)
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {string} filename - Output filename
 * @returns {Promise<string>} - File path
 */
async function savePDFToFile(pdfBuffer, filename = null) {
  return new Promise((resolve, reject) => {
    try {
      const fileName = filename || `receipt_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../public/receipts', fileName);

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFile(filePath, pdfBuffer, (err) => {
        if (err) reject(err);
        else resolve(filePath);
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateReceiptPDF,
  savePDFToFile,
};
