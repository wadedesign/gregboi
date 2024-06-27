import { SlashCommandBuilder, CommandInteraction, TextChannel, ThreadChannel, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

const API_TOKEN = process.env.API_TOKEN as string;
const ACCOUNT_ID = process.env.ACCOUNT_ID as string;
const GATEWAY_ID = process.env.GATEWAY_ID as string;
const MODEL = process.env.MODEL as string;
const MAX_ROUNDS = 5; // Set a limit for the number of rounds

module.exports = {
  data: new SlashCommandBuilder()
    .setName('debate')
    .setDescription('Facilitate a real-time debate between two AIs on a given topic')
    .addStringOption(option =>
      option.setName('topic')
        .setDescription('Topic for the debate')
        .setRequired(true)
    ),
  async execute(interaction: CommandInteraction) {
    const topic = interaction.options.get('topic')?.value as string;
    const forumChannel = interaction.channel as TextChannel;

    await interaction.deferReply();

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
      const thread = await forumChannel.threads.create({
        name: `Debate: ${topic}`,
        autoArchiveDuration: 60,
        reason: `Debate on the topic: ${topic}`,
      });

      const systemMessage1 = 'You are AI 1, arguing for the given topic. Respond to the previous argument if there is one.';
      const systemMessage2 = 'You are AI 2, arguing against the given topic. Respond to the previous argument if there is one.';

      let round = 0;
      let previousArgument = topic;

      await interaction.editReply(`Starting a debate on the topic: ${topic} in thread ${thread.name}`);

      while (round < MAX_ROUNDS) {
        // AI 1's turn
        await thread.sendTyping();
        const response1: any = await run(MODEL, {
          messages: [
            { role: 'system', content: systemMessage1 },
            { role: 'user', content: `Topic: ${topic}\nPrevious argument: ${previousArgument}\nYour turn to argue for the topic.` },
          ],
        });

        if (response1 && response1.result && response1.result.response) {
          const embed1 = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('AI 1 (Pro)')
            .setDescription(response1.result.response)
            .setTimestamp();

          await thread.send({ embeds: [embed1] });
          previousArgument = response1.result.response;
        } else {
          await thread.send('AI 1 encountered an error and cannot continue.');
          break;
        }

        // AI 2's turn
        await thread.sendTyping();
        const response2: any = await run(MODEL, {
          messages: [
            { role: 'system', content: systemMessage2 },
            { role: 'user', content: `Topic: ${topic}\nPrevious argument: ${previousArgument}\nYour turn to argue against the topic.` },
          ],
        });

        if (response2 && response2.result && response2.result.response) {
          const embed2 = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('AI 2 (Con)')
            .setDescription(response2.result.response)
            .setTimestamp();

          await thread.send({ embeds: [embed2] });
          previousArgument = response2.result.response;
        } else {
          await thread.send('AI 2 encountered an error and cannot continue.');
          break;
        }

        round += 1;
      }

      await thread.send('The debate has concluded.');
    } catch (error) {
      console.error(error);
      await interaction.editReply('The debate could not be completed due to an error.');
    }
  },
};