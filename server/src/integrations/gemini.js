import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const textModel = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
const visionModel = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

function parseJsonLoose(text) {
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(cleaned); } catch { return null; }
}

export async function readBookCover(imageBuffer, mimeType) {
  // Not implemented yet
}

export async function generateInterviewQuestions({ title, author, genre }) {
  const FALLBACK_QUESTIONS = [
    'What stuck with you most about this book?',
    'Who would you recommend it to?',
    'How did it leave you feeling?',
  ];

  const prompt = `Write 2 or 3 short questions to ask someone who has just finished reading "${title}" by ${author} (${genre || 'unknown genre'}).

The questions should:
- Be personal and about their experience, not about plot facts or analysis
- Be answerable in one or two sentences
- Be under 15 words each
- Avoid spoilers and avoid assuming they liked it

Good examples: "What stuck with you most about this book?" · "Who would you recommend it to?"

Respond with a JSON array of strings only, no markdown fences.`;

  try {
    const result = await Promise.race([
      textModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
    ]);

    const text = result.response.text();
    const parsed = parseJsonLoose(text);
    
    if (Array.isArray(parsed) && parsed.length >= 2 && parsed.length <= 3 && parsed.every(s => typeof s === 'string' && s.length <= 120)) {
      return parsed;
    }
    return FALLBACK_QUESTIONS;
  } catch (err) {
    console.error('generateInterviewQuestions error:', err);
    return FALLBACK_QUESTIONS;
  }
}

export async function generateReviewArticle({ title, author, genre, displayName, rating, qa }) {
  const qaFormatted = qa.map((item, index) => `Q: ${item.question}\nA: ${item.answer}`).join('\n');
  
  const prompt = `You are a ghostwriter helping a reader write a polished review of a book they just finished.

You are writing on behalf of ${displayName}, who just finished "${title}" by ${author} (${genre || 'unknown genre'}) and rated it ${rating} out of 5. They answered these questions:

${qaFormatted}

Write the review in the FIRST PERSON (using "I", "my") as if you are ${displayName} sharing their thoughts on a social reading app.

Requirements:
- 120–180 words, 2 or 3 short paragraphs
- Tone should be personal, conversational, and warm — like a well-written social media post, not breathless marketing copy
- **Use only what the reader actually said.** Do not invent plot points, characters, themes, or facts about the book. If their answers are thin, keep the piece short rather than padding it.
- Reflect the rating in the tone
- No spoilers beyond what the reader volunteered
- Plain prose only — no markdown, no headings, no bullet points, no title

Return only the article text.`;

  try {
    const result = await Promise.race([
      textModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 1500 }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 20000))
    ]);

    const text = result.response.text().trim().replace(/^#+.*/gm, '').trim();
    if (text.length < 40) {
      throw new Error('Generated text too short');
    }
    return text;
  } catch (err) {
    console.error('generateReviewArticle error:', err);
    throw new ApiError(502, 'INTERNAL', "We couldn't write your review just now. Please try again.");
  }
}
