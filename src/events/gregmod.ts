// src/events/messageModeration.ts
import { Client, Message } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const API_TOKEN = process.env.API_TOKEN as string;
const ACCOUNT_ID = process.env.ACCOUNT_ID as string;
const GATEWAY_ID = process.env.GATEWAY_ID as string;

function isInappropriate(response: string): boolean {
  const inappropriateIndicators = [
    'inappropriate',
    'offensive',
    'hate speech',
    'derogatory',
    'violates the server\'s rules',
    'cannot participate',
    'please refrain'
  ];
  return inappropriateIndicators.some(indicator => response.toLowerCase().includes(indicator));
}

export default (client: Client) => {
  client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return;

    console.log(`Received message from ${message.author.tag}: ${message.content}`);

    async function run(model: string, input: any) {
      const response = await fetch(
        `https://gateway.ai.cloudflare.com/v1/${ACCOUNT_ID}/${GATEWAY_ID}/workers-ai/${model}`,
        {
          headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
          method: 'POST',
          body: JSON.stringify(input),
        }
      );
      const result = await response.json();
      return result;
    }

    try {
      const response: any = await run('@cf/meta/llama-2-7b-chat-int8', {
        messages: [
          {
            role: 'system',
            content: 'You are Greg, a helper in a discord server. Your task is to monitor messages for inappropriate content and flag them.',
          },
          {
            role: 'user',
            content: message.content,
          },
        ],
      });

      console.log('AI Response:', response);

      if (response && response.result && response.result.response && isInappropriate(response.result.response)) {
        await message.delete();
        console.log(`Deleted message from ${message.author.tag} for inappropriate content: ${message.content}`);
        const warningMessage = await message.channel.send(
          `${message.author}, ${response.result.response}`
        );

        setTimeout(() => warningMessage.delete(), 5000); // delete the warning after 5 seconds (will output what the user said that was inappropriate)
      } else {
        console.log(`Message from ${message.author.tag} was not flagged: ${message.content}`);
      }
    } catch (error) {
      console.error('Error in moderation check:', error);
    }
  });
};
