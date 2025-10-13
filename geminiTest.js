require("dotenv").config();  // loads your .env file
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load API key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Simple function to test Gemini
async function testGemini() {
  try {
    // Pick a Gemini model (text-only here)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Send a simple test request
    const prompt = "Is this text AI generated? 'The sun rises in the east and sets in the west.' Please give a number 0-100.";
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log("🔍 Gemini response:");
    console.log(response.text());

  } catch (err) {
    console.error("❌ Error calling Gemini:", err);
  }
}

// Run the test
testGemini();
