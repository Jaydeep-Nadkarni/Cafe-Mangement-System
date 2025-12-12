const { OpenAI } = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate AI response using OpenAI
 * @param {string} prompt - User prompt
 * @param {string} systemMessage - System context message
 * @returns {Promise<string>} AI response
 */
const generateAIResponse = async (prompt, systemMessage = 'You are a helpful assistant for a cafe management system.') => {
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
};

/**
 * Generate menu recommendations
 * @param {Object} preferences - User preferences
 * @returns {Promise<string>} Menu recommendations
 */
const getMenuRecommendations = async (preferences) => {
  const prompt = `Based on the following preferences, recommend items from our cafe menu: ${JSON.stringify(preferences)}`;
  return await generateAIResponse(prompt, 'You are a knowledgeable cafe assistant helping customers choose the best items from our menu.');
};

module.exports = {
  openai,
  generateAIResponse,
  getMenuRecommendations,
};
