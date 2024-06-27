// src/commands/contextMenus/userInfo.ts
import { ContextMenuCommandBuilder, ApplicationCommandType, UserContextMenuCommandInteraction, GuildMember } from 'discord.js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

const API_TOKEN = process.env.API_TOKEN as string;
const ACCOUNT_ID = process.env.ACCOUNT_ID as string;
const GATEWAY_ID = process.env.GATEWAY_ID as string;
const MODEL = process.env.MODEL as string;

export const data = new ContextMenuCommandBuilder()
    .setName('User Information')
    .setType(ApplicationCommandType.User);

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

export async function execute(interaction: UserContextMenuCommandInteraction) {
    const targetUser = interaction.targetUser;
    const targetMember = interaction.targetMember as GuildMember;

    let userInfo = `Username: ${targetUser.username}\n`;
    userInfo += `User ID: ${targetUser.id}\n`;
    userInfo += `Account Created: ${targetUser.createdAt.toDateString()}\n`;

    if (targetMember) {
        userInfo += `Joined Server: ${targetMember.joinedAt?.toDateString() || 'Unknown'}\n`;
        userInfo += `Roles: ${targetMember.roles.cache.map(role => role.name).join(', ')}`;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
        const response: any = await run(MODEL, {
            messages: [
                {
                    role: 'system',
                    content: 'You are Greg, a helper in a discord server. Your task is to summarize user information, in a fun way & also use discord formating when sending your messages.',
                },
                {
                    role: 'user',
                    content: `Summarize the following user information:\n\n${userInfo}`,
                },
            ],
        });

        if (response && response.result && response.result.response) {
            await interaction.editReply({ content: response.result.response});
        } else {
            await interaction.editReply('Unable to summarize user information at this time. Please try again later.');
        }
    } catch (error) {
        console.error(error);
        await interaction.editReply('An error occurred while summarizing the user information.');
    }
}
