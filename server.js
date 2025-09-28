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

// Store current archetypes in memory (in production, use database)
let currentArchetypes = ['Rick Sanchez', 'Elle Woods', 'Donald Trump'];

// Middleware
app.use(express.json());
app.use(express.static('.'));  // Serve static files from current directory

// Archetypal Commentary Function
async function getArchetypalCommentary(text, archetypes) {
  try {
    const prompt = `You are channeling multiple character archetypes to provide commentary on this text: "${text}"

For each of the following characters, provide exactly 2-3 sentences of commentary in their distinctive voice and perspective. Stay true to their personality, speech patterns, and worldview:

Characters: ${archetypes.join(', ')}

Respond with a JSON object where each character name is a key and their commentary is the value:

{
  "Character Name": "2-3 sentences in their voice commenting on the text",
  ...
}

Examples of character voices:
- Rick Sanchez: Cynical, scientific, burps, interdimensional references, rates things
- Elle Woods: Bubbly, fashion-conscious, surprisingly insightful, positive
- Donald Trump: Superlative language, self-referential, "tremendous," "beautiful"

Respond only with the JSON object.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a master character impersonator who can channel any fictional or real personality with perfect accuracy. You understand speech patterns, worldviews, and distinctive traits of characters. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 500
    });

    const response = completion.choices[0].message.content.trim();
    
    // Parse the JSON response
    let parsedResponse;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      parsedResponse = JSON.parse(cleanedResponse);
      console.log('Successfully parsed archetypal commentary');
    } catch (parseError) {
      console.error('Failed to parse archetypal commentary as JSON:', response);
      // Fallback response
      const fallback = {};
      archetypes.forEach(archetype => {
        fallback[archetype] = `Interesting perspective on this text. Each character would have their own unique take on these words.`;
      });
      parsedResponse = fallback;
    }

    return parsedResponse;

  } catch (error) {
    console.error('OpenAI API error for archetypal commentary:', error);
    
    // Fallback response for API errors
    const fallback = {};
    archetypes.forEach(archetype => {
      fallback[archetype] = `${archetype} would have something insightful to say about this text.`;
    });
    return fallback;
  }
}

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

// Archetypes endpoint
app.get('/api/archetypes', (req, res) => {
  console.log('GET /api/archetypes - returning current archetypes:', currentArchetypes);
  res.json(currentArchetypes);
});

// Update archetypes endpoint
app.put('/api/archetypes', (req, res) => {
  try {
    const { archetypes } = req.body;
    
    if (!archetypes || !Array.isArray(archetypes) || archetypes.length !== 3) {
      return res.status(400).json({ error: 'Must provide exactly 3 archetypes' });
    }
    
    // Actually store the updated archetypes
    currentArchetypes = [...archetypes];
    console.log('Updated archetypes:', currentArchetypes);
    
    res.json({ message: 'Archetypes updated successfully', archetypes: currentArchetypes });
    
  } catch (error) {
    console.error('Update archetypes error:', error);
    res.status(500).json({ error: 'Failed to update archetypes' });
  }
});

// Get single archetype commentary endpoint
app.get('/api/archetypes/:archetype', async (req, res) => {
  try {
    const { archetype } = req.params;
    
    console.log(`Getting commentary for archetype: ${archetype}`);
    
    // Mock responses for known archetypes
    const archetypeCommentaries = {
      'Rick Sanchez': "*burp* Oh great, more poetry. Look, your words are just neurons firing in patterns, but hey, at least you're trying to make meaning in this meaningless universe. The divine weeping? That's just anthropomorphizing cosmic indifference, Morty!",
      'Elle Woods': "This is like, totally deep! The way you describe love as this cosmic force - it reminds me of my constitutional law professor who said that justice, like love, requires both passion and precision. Your words have this amazing energy that would totally work in a closing argument!",
      'Donald Trump': "This is beautiful poetry, really beautiful. Some people say it's the most beautiful poetry they've ever seen. The way you talk about love and the universe - it's tremendous, just tremendous. Not everyone can write like this, believe me.",
      'Marcus Aurelius': "While you speak of love as the axis around which all existence turns, remember that our task is not to be swept away by such cosmic dances, but to align our will with reason and accept what is beyond our control with equanimity. The divine may weep for humanity's follies, yet we must focus on what lies within our power—our judgments, our virtue, and our duty to the common good.",
      'Shakespeare': "Ah, what light through yonder window breaks? 'Tis love itself, and the heart is the sun! Yet mark me well—love's labours are not lost when tempered with wisdom's gentle hand.",
      'Buddha': "In your words, I perceive the attachment that brings both joy and suffering. Love, like all phenomena, is impermanent. Find peace in this truth, for in accepting impermanence, we discover the eternal.",
      'Yoda': "Strong with love, this text is. But remember, young one—attachment leads to suffering. Love without possessing, you must. The way of the Force, this is."
    };
    
    // If we have a predefined response, use it
    if (archetypeCommentaries[archetype]) {
      res.json({ commentary: archetypeCommentaries[archetype] });
      return;
    }
    
    // For new archetypes, generate dynamic commentary using OpenAI
    try {
      const prompt = `You are ${archetype}. Someone has shared this text with you: "Love is the axis around which all existence turns. We are celestial bodies in orbit around something both tender and terrible. The divine weeps for us, knowing we mistake the dance for the destination."

Respond as ${archetype} would, staying true to their character, personality, speaking style, and worldview. Keep the response to 2-3 sentences maximum.`;
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.8
      });
      
      const commentary = completion.choices[0].message.content.trim();
      res.json({ commentary });
      
    } catch (openaiError) {
      console.error('OpenAI error for dynamic archetype:', openaiError);
      // Fallback for OpenAI errors
      const fallbackCommentary = `${archetype} would offer their unique perspective on these words, drawing from their distinctive worldview and experience. Their voice would add depth to understanding this text through their particular lens of wisdom and experience.`;
      res.json({ commentary: fallbackCommentary });
    }
    
  } catch (error) {
    console.error('Get archetype commentary error:', error);
    res.status(500).json({ error: 'Failed to get archetype commentary' });
  }
});

// Archetypal commentary endpoint
app.post('/api/archetypal-commentary', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length < 3) {
      return res.status(400).json({ error: 'Text too short' });
    }

    // Use current stored archetypes instead of passed ones
    const archetypesToUse = currentArchetypes;

    // Log for debugging
    console.log(`Getting archetypal commentary for: "${text}"`);
    console.log(`Using current archetypes: ${archetypesToUse.join(', ')}`);
    
    const commentary = await getArchetypalCommentary(text, archetypesToUse);
    
    res.json(commentary);
    
  } catch (error) {
    console.error('Archetypal commentary error:', error);
    res.status(500).json({ error: 'Commentary failed' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Eris server running at http://localhost:${PORT}`);
});