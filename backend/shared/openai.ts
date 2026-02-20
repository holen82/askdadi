import { AzureOpenAI } from 'openai';
import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

class OpenAIService {
  private client: AzureOpenAI | null = null;
  private deployment: string;

  constructor() {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'chat';

    if (!endpoint) {
      console.warn('OpenAI endpoint not configured. Chat functionality will be limited.');
      this.deployment = deployment;
      return;
    }

    try {
      // Use API key authentication if available, otherwise use managed identity
      if (apiKey) {
        this.client = new AzureOpenAI({
          apiKey,
          endpoint,
          apiVersion: '2024-10-21',
          deployment
        });
      } else {
        const credential = new DefaultAzureCredential();
        const scope = 'https://cognitiveservices.azure.com/.default';
        const azureADTokenProvider = getBearerTokenProvider(credential, scope);
        
        this.client = new AzureOpenAI({
          azureADTokenProvider,
          endpoint,
          apiVersion: '2024-10-21',
          deployment
        });
      }
      
      this.deployment = deployment;
      console.log('OpenAI client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      throw error;
    }
  }

  async chat(messages: ChatCompletionMessageParam[]): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Check your configuration.');
    }

    try {
      const result = await this.client.chat.completions.create({
        model: this.deployment,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      const choice = result.choices[0];
      
      if (!choice || !choice.message) {
        throw new Error('No response from OpenAI');
      }

      return choice.message.content || 'No response generated';
    } catch (error) {
      console.error('OpenAI API error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('authentication')) {
          throw new Error('OpenAI authentication failed. Check your API key.');
        } else if (error.message.includes('429')) {
          throw new Error('Too many requests. Please try again later.');
        } else if (error.message.includes('quota')) {
          throw new Error('OpenAI quota exceeded. Please contact your administrator.');
        }
      }
      
      throw new Error('Failed to get response from AI. Please try again.');
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }
}

export const openAIService = new OpenAIService();
