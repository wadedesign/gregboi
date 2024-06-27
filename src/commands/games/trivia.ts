// src/commands/general/trivia.ts
import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, ComponentType } from 'discord.js';
import { supabase } from '../../utils/supabaseClient';
import handleError from '../../utils/errorHandler'; 
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

const API_TOKEN = process.env.API_TOKEN as string;
const ACCOUNT_ID = process.env.ACCOUNT_ID as string;
const GATEWAY_ID = process.env.GATEWAY_ID as string;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Get a random trivia question'),
  async execute(interaction: CommandInteraction) {
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

      if (data.length === 0) {
        await interaction.editReply('ask trivia owner to update me');
        return;
      }

      const dbData = data.map((item: any) => item.id).join('\n\n');

      const response: any = await run('@cf/meta/llama-2-7b-chat-int8', {
        messages: [
          {
            role: 'system',
            content: 'You are a greg bot in a discord server. Generate a trivia question with multiple choice answers.',
          }
        ],
      });

      if (response && response.result && response.result.response) {
        const triviaData = response.result.response.split('\n').filter(Boolean); // Filter out empty strings
        if (triviaData.length < 2) {
          await interaction.editReply('greg mainframe did not generate a valid question. please try again later.');
          return;
        }

        const question = triviaData[0];
        const options = triviaData.slice(1);
        const correctAnswer = options[0];  // Assuming the first option is the correct answer

        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('Trivia Question')
          .setDescription(question)
          .setTimestamp();

        const optionsData = options.map((option: string, index: number) => ({
          label: `Option ${index + 1}`,
          description: option,
          value: option,
        }));

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('trivia_select')
            .setPlaceholder('Choose an option')
            .addOptions(optionsData)
        );

        await interaction.editReply({ embeds: [embed], components: [row] });

        const filter = (i: StringSelectMenuInteraction) => i.user.id === interaction.user.id;

        const collector = interaction.channel?.createMessageComponentCollector({
          filter,
          componentType: ComponentType.StringSelect,
          time: 15000,
        });

        collector?.on('collect', async (i) => {
          const selectedOption = i.values[0];
          if (selectedOption === correctAnswer) {
            await interaction.followUp('Correct! Great job!');
          } else {
            await interaction.followUp(`Incorrect. The correct answer was: ${correctAnswer}`);
          }
        });

        collector?.on('end', async () => {
          if (!collector.ended) {
            await interaction.followUp('Time is up! Please try again.');
          }
        });

      } else {
        await interaction.editReply('trivia mainframe is down. please try again later.');
      }
    } catch (error) {
    await handleError(interaction, error); // custom error handler
    }
  },
};


// {TODO}
// make embeds - not public
// faster response time