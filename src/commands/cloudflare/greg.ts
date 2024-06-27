// src/commands/cloudflare/greg.ts
import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { supabase } from '../../utils/supabaseClient';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

const API_TOKEN = process.env.API_TOKEN as string;
const ACCOUNT_ID = process.env.ACCOUNT_ID as string;
const GATEWAY_ID = process.env.GATEWAY_ID as string;
const MODEL = process.env.MODEL as string;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('greg') // change this to the name of your command
    .setDescription('get help with greg')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('question to ask greg')
        .setRequired(true)
    ),
  async execute(interaction: CommandInteraction) {
    const prompt = interaction.options.get('prompt')?.value as string;

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
      const { data, error } = await supabase
        .from('infotable')
        .select('id');

      if (error) {
        throw new Error('Error fetching data from Supabase: ' + error.message);
      }

      console.log('Fetched Data from Supabase:', data);

      if (data.length === 0) {
        await interaction.editReply('ask gregs owner to update me');
        return;
      }

      const dbData = data.map((item: any) => item.id).join('\n\n');

      console.log('Data to be sent to AI:', `${prompt}\n\nHere is some additional data:\n${dbData}`);

      const response: any = await run(MODEL, {
        messages: [
          {
            role: 'system',
            content: 'You are Greg, a helper in a discord server. You are helping a user with a question, and make sure to use markdown to format your response.',
          },
          {
            role: 'user',
            content: `${prompt}\n\nHere is some additional data:\n${dbData}`,
          },
        ],
      });

      console.log('API Response:', response);

      if (response && response.result && response.result.response) {
        const embed = new EmbedBuilder()
          .setColor('#36393F')
          .setTitle('gregs answer')
          .setDescription(response.result.response)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply('greg mainframe is down. please try again later.');
      }
    } catch (error) {
      console.error(error);
      await interaction.editReply('greg was to dumb to answer that question.');
    }
  },
};


/**
  * @TODO 
  * better embed
  * more precise answering
  * custom emojis
  */