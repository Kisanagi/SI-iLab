const GroqSDK = require('groq-sdk');
const Groq = GroqSDK.default ?? GroqSDK;

// Satu client Groq dipakai untuk reasoning & vision — provider & API key sama,
// yang membedakan hanya model ID yang dikirim per-request (MODEL_REASONING / MODEL_VISION).
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

module.exports = { groqReasoning: groq, groqVision: groq };
