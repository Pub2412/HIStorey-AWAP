const nodemailer = require('nodemailer')
const PDFDocument = require('pdfkit')

// Simple role check middleware using header 'x-user-role'
function checkAdmin(req, res, next) {
	const role = (req.headers['x-user-role'] || '').toLowerCase()
	if (role === 'admin') return next()
	return res.status(403).json({ message: 'Admin role required (set header x-user-role: admin)' })
}

// Create transporter once using ethereal for testing
let testTransporter = null
async function getTestTransporter() {
	if (testTransporter) return testTransporter

	// If Mailtrap env vars are provided, use Mailtrap SMTP (recommended for testing)
	const host = process.env.MAILTRAP_HOST
	const port = process.env.MAILTRAP_PORT
	const user = process.env.MAILTRAP_USER
	const pass = process.env.MAILTRAP_PASS

	if (host && port && user && pass) {
		testTransporter = nodemailer.createTransport({
			host,
			port: Number(port),
			secure: false,
			auth: { user, pass }
		})
		return testTransporter
	}

	// Fallback: create an Ethereal test account for quick testing when Mailtrap not configured
	const testAccount = await nodemailer.createTestAccount()
	testTransporter = nodemailer.createTransport({
		host: 'smtp.ethereal.email',
		port: 587,
		secure: false,
		auth: {
			user: testAccount.user,
			pass: testAccount.pass
		}
	})
	return testTransporter
}

// Generate a small PDF receipt and send it via nodemailer
async function sendReceiptEmail(transaction) {
	const transporter = await getTestTransporter()

	// generate PDF buffer
	const doc = new PDFDocument()
	const chunks = []
	doc.on('data', c => chunks.push(c))
	const endPromise = new Promise((resolve) => doc.on('end', resolve))
	doc.fontSize(18).text('Receipt', { underline: true })
	doc.moveDown()
	doc.fontSize(12).text(`Transaction ID: ${transaction.id}`)
	doc.text(`Status: ${transaction.status}`)
	doc.text(`Total: ${transaction.total}`)
	doc.text(`Updated: ${transaction.updatedAt}`)
	doc.moveDown()
	doc.text('Items:')
	transaction.items.forEach((it, idx) => {
		doc.text(`${idx + 1}. ${it.name || 'Item'} - ${it.price ?? ''}`)
	})
	doc.end()
	await endPromise
	const pdfBuffer = Buffer.concat(chunks)

	const mail = await transporter.sendMail({
		from: 'no-reply@example.com',
		to: transaction.email,
		subject: `Receipt for transaction ${transaction.id}`,
		text: 'Please find attached receipt PDF.',
		attachments: [{ filename: `receipt-${transaction.id}.pdf`, content: pdfBuffer }]
	})

	// return preview URL (ethereal)
	return { messageId: mail.messageId, preview: nodemailer.getTestMessageUrl(mail) }
}

module.exports = { checkAdmin, sendReceiptEmail }
