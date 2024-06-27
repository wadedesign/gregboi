// src/lib/errorUtils.ts
import { TextChannel, CommandInteraction, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

const errorLogFile = path.join(__dirname, '../utils/errorLog.json');
const adminChannelId = process.env.ERROR_CHANNEL;

if (!adminChannelId) {
  throw new Error('ERROR_CHANNEL environment variable is not set.');
}

export const generateErrorId = (): string => {
  return Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
};

export const logError = (errorId: string, error: any): void => {
  const errorLog = fs.existsSync(errorLogFile) ? JSON.parse(fs.readFileSync(errorLogFile, 'utf8')) : {};
  errorLog[errorId] = {
    error: error.message || error,
    stack: error.stack || 'No stack trace available',
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(errorLogFile, JSON.stringify(errorLog, null, 2), 'utf8');
};

export const sendErrorToAdminChannel = async (interaction: CommandInteraction, errorId: string, userEmbed: EmbedBuilder): Promise<void> => {
  const channel = await interaction.client.channels.fetch(adminChannelId) as TextChannel;

  const adminEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('⚠️ **Error Log**')
    .setDescription(`An error occurred while processing a command.\n\n**Error ID:** \`${errorId}\``)
    .addFields(
      { name: '📅 **Timestamp**', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
      { name: '👤 **User**', value: `${interaction.user.tag} (\`${interaction.user.id}\`)`, inline: false },
      { name: '📝 **Command**', value: `/${interaction.commandName}`, inline: false }
    );

  await channel.send({ embeds: [adminEmbed] });
};
