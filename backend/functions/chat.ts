import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { extractUserFromHeaders, getUserEmail, isWhitelisted } from '../shared/auth.js';
import { openAIService } from '../shared/openai.js';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

interface ChatResponse {
  message: string;
  error?: string;
}

/**
 * Azure Function for handling chat messages with OpenAI
 */
async function chatFunction(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Chat request received');

  // Verify authentication
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const user = extractUserFromHeaders(headers);
  
  if (!user) {
    context.log('No user found in request headers');
    return {
      status: 401,
      jsonBody: {
        error: 'Unauthorized',
        message: 'User not authenticated'
      }
    };
  }

  const email = getUserEmail(user);
  
  if (!isWhitelisted(email)) {
    context.log('User not whitelisted:', email);
    return {
      status: 403,
      jsonBody: {
        error: 'Forbidden',
        message: 'User not authorized to access this application'
      }
    };
  }

  // Parse request body
  let chatRequest: ChatRequest;
  
  try {
    const bodyText = await request.text();
    chatRequest = JSON.parse(bodyText);
  } catch (error) {
    context.log('Invalid request body:', error);
    return {
      status: 400,
      jsonBody: {
        error: 'Bad Request',
        message: 'Invalid request body'
      }
    };
  }

  // Validate messages
  if (!chatRequest.messages || !Array.isArray(chatRequest.messages) || chatRequest.messages.length === 0) {
    return {
      status: 400,
      jsonBody: {
        error: 'Bad Request',
        message: 'Messages array is required and must not be empty'
      }
    };
  }

  // Check OpenAI configuration
  if (!openAIService.isConfigured()) {
    context.log('OpenAI not configured');
    return {
      status: 503,
      jsonBody: {
        error: 'Service Unavailable',
        message: 'AI service is not configured'
      }
    };
  }

  try {
    // Add system prompt if not present
    const messages: ChatCompletionMessageParam[] = chatRequest.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    if (!messages.some(msg => msg.role === 'system')) {
      messages.unshift({
        role: 'system',
        content: 'You are Dadi, a helpful AI assistant. Provide clear, concise, and accurate responses.'
      });
    }

    context.log(`Processing chat for user ${email} with ${messages.length} messages`);

    const response = await openAIService.chat(messages);

    context.log('Chat response generated successfully');

    const chatResponse: ChatResponse = {
      message: response
    };

    return {
      status: 200,
      jsonBody: chatResponse
    };
  } catch (error) {
    context.log('Error processing chat:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      status: 500,
      jsonBody: {
        error: 'Internal Server Error',
        message: errorMessage
      }
    };
  }
}

app.http('chat', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: chatFunction
});
