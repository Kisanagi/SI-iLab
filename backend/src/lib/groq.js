const GroqSDK = require('groq-sdk');
const Groq = GroqSDK.default ?? GroqSDK;

const groqReasoning = new Groq({ apiKey: process.env.GROQ_API_KEY_REASONING });
const groqVision = new Groq({ apiKey: process.env.GROQ_API_KEY_VISION });

module.exports = { groqReasoning, groqVision };
