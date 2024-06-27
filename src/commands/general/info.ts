// src/commands/general/info.ts
import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import * as fs from 'fs';
import * as ini from 'ini';
import * as path from 'path';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Replies with information from an INI file'),
  async execute(interaction: CommandInteraction) {
    const filePath = path.join(__dirname, '../../config/info.ini');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const config = ini.parse(fileContent);

    const sections = Object.keys(config);
    let currentIndex = 0;

    const generateEmbed = (index: number) => {
      const sectionName = sections[index];
      const section = config[sectionName];

      const fields = Object.keys(section).map(key => ({
        name: key,
        value: section[key] || 'N/A',
        inline: false
      }));

      return new EmbedBuilder()
        .setColor('#36393F')
        .setTitle(`ℹ️ Info - ${sectionName}`)
        .addFields(fields)
        .setTimestamp()
        .setFooter({ text: `Page ${index + 1} of ${sections.length}`, iconURL: 'https://example.com/icon.png' });
    };

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('previous')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentIndex === 0),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentIndex === sections.length - 1)
      );

    const message = await interaction.reply({ embeds: [generateEmbed(currentIndex)], components: [row], fetchReply: true });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) return;

      if (i.customId === 'previous' && currentIndex > 0) {
        currentIndex--;
      } else if (i.customId === 'next' && currentIndex < sections.length - 1) {
        currentIndex++;
      }

      await i.update({
        embeds: [generateEmbed(currentIndex)],
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('previous')
                .setLabel('Previous')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentIndex === 0),
              new ButtonBuilder()
                .setCustomId('next')
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentIndex === sections.length - 1)
            )
        ]
      });
    });

    collector.on('end', async () => {
      await interaction.editReply({
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('previous')
                .setLabel('Previous')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId('next')
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true)
            )
        ]
      });
    });
  },
};
