const { GoogleGenerativeAI } = require('@google/generative-ai');
const ProductModel = require('../models/product');

let genAI = null;
let model = null;

function initAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && !genAI) {
        genAI = new GoogleGenerativeAI(apiKey);
    }
}

exports.chat = async (req, res) => {
    try {
        const { message, history } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        initAI();
        if (!genAI) {
            return res.json({ 
                reply: "Hello! I am Bubbles, your AI Shopping Assistant. To unlock my full capabilities, please ask the site administrator to add a valid `GEMINI_API_KEY` to the `.env` file! In the meantime, feel free to browse our wonderful vintage collection."
            });
        }

        // Fetch all non-deleted products to provide context
        const products = await ProductModel.findAll({
            where: { is_deleted: false },
            attributes: ['id', 'name', 'price', 'category', 'condition', 'stock']
        });

        const productContext = products.map(p => 
            `- ID: ${p.id} | Name: ${p.name} | Price: PHP ${p.price} | Category: ${p.category} | Condition: ${p.condition} | Stock: ${p.stock > 0 ? p.stock : 'Out of stock'}`
        ).join('\n');

        const systemPrompt = `You are Bubbles, the friendly and knowledgeable shopping assistant for HIStore'y, a vintage record store.
Your goal is to enthusiastically help users find products and make purchases.

CATALOG:
${productContext}

STRICT INSTRUCTIONS:
1. When asked for recommendations, suggest items from the CATALOG.
2. In your text, format product names as Markdown links pointing to their page (e.g. [Thriller Vinyl](/product/1)).
3. CRITICAL: Whenever you recommend a product, you MUST invisibly append the tag [PRODUCT:id] at the VERY END of your response. Example: [PRODUCT:5]
4. NEVER mention or explain the "[PRODUCT:id]" tag to the user. It is a hidden system code. Talk like a real human assistant!`;

        const dynamicModel = genAI.getGenerativeModel({ 
            model: 'gemini-flash-latest',
            systemInstruction: systemPrompt
        });

        const chatSession = dynamicModel.startChat({
            history: (history || []).map(msg => ({
                role: msg.role === 'bot' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            })),
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
            }
        });

        const result = await chatSession.sendMessage(message);
        const responseText = result.response.text();

        return res.json({ reply: responseText });
    } catch (error) {
        console.error('Chatbot Error:', error);
        return res.status(500).json({ error: 'Failed to process chat message' });
    }
};
