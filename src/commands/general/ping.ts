import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import moment from 'moment';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction: CommandInteraction) {
    const latency = Date.now() - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);
    
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🏓 Pong!')
      .setDescription('Here are the latency details:')
      .addFields(
        { name: '⏱️ Latency', value: `${latency}ms`, inline: true },
        { name: '📡 API Latency', value: `${apiLatency}ms`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: `Requested at ${moment().format('LLLL')}`, iconURL: 'https://example.com/icon.png' });

    await interaction.reply({ embeds: [embed] });
  },
};
