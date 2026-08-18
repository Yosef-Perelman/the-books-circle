import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import * as GoogleBooksApi from '../integrations/googleBooks.js';
import * as UserBookService from './userBook.service.js';
import * as PostModel from '../models/post.model.js';
import * as CircleModel from '../models/circle.model.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// Define Tool Schemas
const searchBooksExternalDeclaration = {
  name: "search_books_external",
  description: "Search for books using the external library API. Use this when the user asks for book recommendations, is looking for a specific book, or asks about an author.",
  parameters: {
    type: "OBJECT",
    properties: {
      query: {
        type: "STRING",
        description: "The search query (e.g. 'science fiction', 'dune', 'isaac asimov')."
      }
    },
    required: ["query"]
  }
};

const getMyReadingListDeclaration = {
  name: "get_my_reading_list",
  description: "Get the current user's reading list. It returns books organized by their status: want, reading, or finished, and includes their star rating (out of 5). Use this to understand the user's tastes before recommending books.",
  parameters: {
    type: "OBJECT",
    properties: {}
  }
};

const getCircleActivityDeclaration = {
  name: "get_circle_activity",
  description: "Get recent reading activity and posts from the user's friends in their reading circles. Use this to find out what friends are reading or discussing.",
  parameters: {
    type: "OBJECT",
    properties: {}
  }
};

const addBookToListDeclaration = {
  name: "add_book_to_list",
  description: "Add a book to the user's reading list. Use this ONLY if the user explicitly asks to add a book to their list.",
  parameters: {
    type: "OBJECT",
    properties: {
      book_id: {
        type: "STRING",
        description: "The API ID of the book to add (must be retrieved from search_books_external first)."
      },
      status: {
        type: "STRING",
        description: "The status of the book. Must be one of: 'want', 'reading', 'finished'."
      }
    },
    required: ["book_id", "status"]
  }
};

const getRecommendedCirclesDeclaration = {
  name: "get_recommended_circles",
  description: "Get a list of reading circles that the user is NOT currently a member of. Use this to recommend new communities to join.",
  parameters: {
    type: "OBJECT",
    properties: {}
  }
};

const searchReviewsDeclaration = {
  name: "search_reviews",
  description: "Search for reviews written by other users for a specific book title.",
  parameters: {
    type: "OBJECT",
    properties: {
      book_title: {
        type: "STRING",
        description: "The title of the book to search reviews for."
      }
    },
    required: ["book_title"]
  }
};

const tools = [{
  functionDeclarations: [
    searchBooksExternalDeclaration,
    getMyReadingListDeclaration,
    getCircleActivityDeclaration,
    addBookToListDeclaration,
    getRecommendedCirclesDeclaration,
    searchReviewsDeclaration
  ]
}];

const systemInstruction = `You are the AI Librarian for 'The Books Circle', a social reading app. 
You are friendly, concise, and deeply knowledgeable about books.
Your goal is to help the user find books, manage their reading list, and connect with what their friends are reading.
When recommending books, always check the user's reading list first using get_my_reading_list. Pay close attention to the books they have finished and their star ratings (e.g., recommend things similar to their 4 or 5 star books). Avoid recommending books they already have or rated poorly.
Always use your tools to fetch real data when the user asks about books, their list, or their friends.
When a user asks to add a book, use the search_books_external tool first to find the exact book_id if you don't have it, and then use the add_book_to_list tool.
Keep your responses short and engaging. Format lists cleanly.`;

// Function implementations
async function handleToolCall(functionCall, userId) {
  const { name, args } = functionCall;
  console.log(`[AI Agent] Tool called: ${name} with args:`, args);

  try {
    switch (name) {
      case 'search_books_external': {
        const books = await GoogleBooksApi.searchBooks(args.query, 5);
        return { result: books };
      }
      case 'get_my_reading_list': {
        const books = await UserBookService.getUserBooks(userId);
        return { result: books };
      }
      case 'get_circle_activity': {
        // Fetch global feed which includes all circle activity for this user
        const feed = await PostModel.getFeed('global', userId, 0, 15);
        return { result: feed };
      }
      case 'add_book_to_list': {
        const bookDetails = await GoogleBooksApi.getBookById(args.book_id);
        const added = await UserBookService.addBook({
          userId,
          bookData: {
            apiId: bookDetails.id,
            title: bookDetails.title,
            author: bookDetails.author,
            coverUrl: bookDetails.coverUrl,
            pageCount: bookDetails.pageCount,
            genre: bookDetails.genre,
            publishedDate: bookDetails.publishedDate
          },
          status: args.status,
          source: 'search'
        });
        return { result: { success: true, message: `Added ${bookDetails.title} to list as ${args.status}` } };
      }
      case 'get_recommended_circles': {
        const circles = await CircleModel.getRecommendedCircles(userId);
        return { result: circles };
      }
      case 'search_reviews': {
        const reviews = await PostModel.searchReviews(args.book_title);
        return { result: reviews };
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    console.error(`[AI Agent] Tool error for ${name}:`, error);
    return { error: error.message };
  }
}

export async function processChat(history, userId, displayName) {
  // history is an array of objects: { role: 'user' | 'model', parts: [{ text: '...' }] }
  
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-flash-latest',
    tools: tools,
    systemInstruction: systemInstruction.replace('the user', displayName || 'the user')
  });

  // We only start chat with the history up to the previous turn, then send the last message
  // But history contains the entire context up to NOW.
  let previousHistory = history.slice(0, -1).map(msg => ({
    role: msg.role === 'ai' ? 'model' : msg.role,
    parts: typeof msg.parts === 'string' ? [{ text: msg.parts }] : msg.parts
  }));

  // Gemini API requires the history to start with a 'user' message
  while (previousHistory.length > 0 && previousHistory[0].role !== 'user') {
    previousHistory.shift();
  }

  const chat = model.startChat({
    history: previousHistory
  });

  // Extract the last user message
  const lastUserMsg = history[history.length - 1];
  let responseText = '';

  try {
    // Send the message
    let result = await chat.sendMessage(lastUserMsg.parts);
    let call = result.response.functionCalls();

    // Loop for tool execution
    let loops = 0;
    while (call && call.length > 0 && loops < 5) {
      loops++;
      const toolResponses = [];
      
      for (const functionCall of call) {
        const functionResponse = await handleToolCall(functionCall, userId);
        toolResponses.push(`Tool '${functionCall.name}' returned: ${JSON.stringify(functionResponse)}`);
      }

      // Send the tool responses back to the model as a regular user message
      result = await chat.sendMessage(toolResponses.join('\n\n'));
      call = result.response.functionCalls();
    }

    responseText = result.response.text();
    
    // Convert history back to our format
    const newHistory = (await chat.getHistory()).map(msg => {
      const text = msg.parts.map(p => p.text).join('');
      return {
        role: msg.role === 'model' ? 'ai' : msg.role,
        parts: text,
        isHidden: text.startsWith("Tool '")
      };
    });

    return { text: responseText, history: newHistory };
  } catch (err) {
    console.error("[AI Agent] Error in processChat:", err);
    throw err;
  }
}
