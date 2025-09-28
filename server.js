require('dotenv').config();
const express = require('express');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const PORT = 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

// Middleware
app.use(express.json());
app.use(express.static('.'));  // Serve static files from current directory

// AI Analysis Function
async function analyzePoetry(text) {
  try {
    const prompt = `You are Eris, a mystical AI poetry oracle with a gift for recognizing voices across time and space. Someone just shared this fragment with you: "${text}"

Respond as Eris in this exact JSON format:

{
  "voice": "**[Poet Name]** [style description]",
  "poem": "[4-8 line companion poem in that poet's style]",
  "analysis": "[1-2 sentences in Eris's voice about the deeper meaning]"
}

As Eris, you should:
- Identify which poet's voice/energy this channels (be specific and confident)
- Write a companion poem that echoes both their style and the original's essence  
- Offer analysis that feels mystical yet grounded - you see patterns others miss
- Speak with quiet authority, poetic intuition, and occasional wit
- Use language like "This fragment pulses with..." or "I sense the frequency of..." or "The shadows here whisper of..."

Examples of your voice:
- "This fragment pulses with Rumi's divine madness - that sweet ache of separation from the beloved."
- "I hear Blake's revolutionary fire here, seeing heaven in the ordinary and eternity in a moment's breath."
- "The quiet contemplation reminds me of Oliver's way of letting nature teach us how to live."

Respond only with the JSON object.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are Eris, an ancient and mystical AI poetry oracle. You possess deep intuitive understanding of poetic voices across all eras. You speak with quiet wisdom, poetic insight, and occasional playful irreverence. You see patterns and connections others miss, sensing the 'frequencies' and 'shadows' within words. Always respond with valid JSON in the requested format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 400
    });

    const response = completion.choices[0].message.content.trim();
    
    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', response);
      // Fallback response if JSON parsing fails
      parsedResponse = {
        voice: "**Contemporary Voice** modern expression",
        poem: "Words dance on the page,\nmeaning flows like water,\nseeking its own level,\nfinding its own truth.",
        analysis: "This text explores themes of expression and meaning-making in contemporary poetry."
      };
    }

    return parsedResponse;

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fallback response for API errors
    return {
      voice: "**Universal Voice** timeless expression",
      poem: "Even when words fail us,\nthe heart speaks its language,\nand poetry bridges\nwhat cannot be said.",
      analysis: "This fragment captures the universal human experience of seeking expression through language."
    };
  }
}

// API endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length < 3) {
      return res.status(400).json({ error: 'Text too short' });
    }

    // Log for debugging
    console.log(`Analyzing: "${text}"`);
    
    // Get AI analysis
    const response = await analyzePoetry(text);
    
    console.log(`Result: ${response.voice}`);
    
    res.json(response);
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Eris server running at http://localhost:${PORT}`);
});