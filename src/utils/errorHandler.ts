// src/utils/errorHandler.ts
import { CommandInteraction, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import { generateErrorId, logError, sendErrorToAdminChannel } from '../lib/errorUtils';

dotenv.config();

const sendErrorEmbed = async (interaction: CommandInteraction, errorId: string): Promise<void> => {
  const embed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('⚠️ **An Unexpected Error Occurred**')
    .setDescription('We encountered an error while processing your command. Please report the error ID below to the admin.')
    .addFields(
      { name: '🔖 **Error ID**', value: `\`${errorId}\``, inline: false },
      { name: '📅 **Timestamp**', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
      { name: '📣 **Action Required**', value: 'Report this error ID to the admin as soon as possible for further assistance.', inline: false }
    )
    .setThumbnail('https://example.com/error-icon.png') // place holder will change later
    .setTimestamp()
    .setFooter({ text: 'Thank you for your patience and understanding.', iconURL: 'https://example.com/footer-icon.png' });

  await interaction.reply({ embeds: [embed], ephemeral: true });
  await sendErrorToAdminChannel(interaction, errorId, embed);
};

const handleError = async (interaction: CommandInteraction, error: any): Promise<void> => {
  const errorId = generateErrorId();
  logError(errorId, error);
  await sendErrorEmbed(interaction, errorId);
};

export default handleError;
