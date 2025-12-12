const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder', // Fallback for development
});

// @route   POST /api/ai/chat
// @desc    Chat with AI assistant
// @access  Public
router.post('/chat', async (req, res) => {
  try {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: 'Messages array is required'
      });
    }

    // System prompt to define the AI's persona
    const systemMessage = {
      role: 'system',
      content: `You are a friendly and knowledgeable AI assistant for a Cafe Management System. 
      Your goal is to help customers with menu recommendations, explain ingredients, suggest pairings, and answer questions about allergens or nutritional info.
      
      ${context ? `The user is currently asking about this specific item: ${JSON.stringify(context)}` : ''}
      
      Keep your responses concise, helpful, and appetizing. Use emojis where appropriate.`
    };

    const completion = await openai.chat.completions.create({
      messages: [systemMessage, ...messages],
      model: 'gpt-3.5-turbo', // or gpt-4 if available
    });

    const aiResponse = completion.choices[0].message;

    res.status(200).json({
      success: true,
      data: aiResponse
    });
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    
    // Fallback response if API fails or key is missing
    res.status(200).json({
      success: true,
      data: {
        role: 'assistant',
        content: "I'm currently in offline mode (OpenAI API key missing or error). But I'd love to tell you that our coffee is roasted fresh daily! ☕"
      }
    });
  }
});

module.exports = router;
