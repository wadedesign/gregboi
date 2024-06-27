import {
    SlashCommandBuilder,
    CommandInteraction,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    ComponentType,
    AttachmentBuilder,
  } from 'discord.js';
  import { supabase } from '../../utils/supabaseClient';
  import handleError from '../../utils/errorHandler';
  import fetch from 'node-fetch';
  import * as dotenv from 'dotenv';
  import { createCanvas, registerFont } from 'canvas';
  
  dotenv.config();
  
  const API_TOKEN = process.env.API_TOKEN as string;
  const ACCOUNT_ID = process.env.ACCOUNT_ID as string;
  const GATEWAY_ID = process.env.GATEWAY_ID as string;
  
  registerFont('public/Space Grotesk/SpaceGrotesk-VariableFont_wght.ttf', { family: 'CustomFont' });
  
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
        const { data, error } = await supabase.from('infotable').select('id');
  
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
            },
          ],
        });
  
        if (response && response.result && response.result.response) {
            const triviaData = response.result.response.split('\n').filter(Boolean);
            if (triviaData.length < 2) {
              await interaction.editReply('greg mainframe did not generate a valid question. please try again later.');
              return;
            }
    
            const question = triviaData[0];
            const options = triviaData.slice(1);
            const correctAnswer = options[0];
    
            // Create canvas with smaller dimensions
            const canvas = createCanvas(400, 200);
            const ctx = canvas.getContext('2d');
    
            // Background gradient
            const gradient = ctx.createLinearGradient(0, 0, 400, 200);
            gradient.addColorStop(0, '#2c3e50');
            gradient.addColorStop(1, '#34495e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 400, 200);
    
            // Add a decorative element
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(50, 0);
            ctx.lineTo(0, 50);
            ctx.closePath();
            ctx.fillStyle = '#f39c12';
            ctx.fill();
    
            // Text styles
            ctx.fillStyle = '#ecf0f1';
            ctx.font = 'bold 24px CustomFont, Arial';
            ctx.fillText('Trivia Question', 20, 40);
    
            // Wrap and render question text
            ctx.font = '18px CustomFont, Arial';
            const words = question.split(' ');
            let line = '';
            let y = 70;
            for (let i = 0; i < words.length; i++) {
              const testLine = line + words[i] + ' ';
              const metrics = ctx.measureText(testLine);
              if (metrics.width > 360 && i > 0) {
                ctx.fillText(line, 20, y);
                line = words[i] + ' ';
                y += 25;
              } else {
                line = testLine;
              }
            }
            ctx.fillText(line, 20, y);
    
            // Add a subtle border
            ctx.strokeStyle = '#bdc3c7';
            ctx.lineWidth = 3;
            ctx.strokeRect(10, 10, 380, 180);
    
            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'trivia-question.png' });
  
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
  
          await interaction.editReply({ files: [attachment], components: [row] });
  
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
        await handleError(interaction, error);
      }
    },
  };
  