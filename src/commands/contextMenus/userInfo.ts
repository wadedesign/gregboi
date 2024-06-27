// src/commands/contextMenus/userInfo.ts
import { ContextMenuCommandBuilder, ApplicationCommandType, UserContextMenuCommandInteraction, GuildMember } from 'discord.js';

export const data = new ContextMenuCommandBuilder()
    .setName('User Information')
    .setType(ApplicationCommandType.User);

export async function execute(interaction: UserContextMenuCommandInteraction) {
    const targetUser = interaction.targetUser;
    const targetMember = interaction.targetMember as GuildMember; 

    let response = `Username: ${targetUser.username}\n`;
    response += `User ID: ${targetUser.id}\n`;
    response += `Account Created: ${targetUser.createdAt.toDateString()}\n`;

    if (targetMember) {
        response += `Joined Server: ${targetMember.joinedAt?.toDateString() || 'Unknown'}\n`;
        response += `Roles: ${targetMember.roles.cache.map(role => role.name).join(', ')}`;
    }

    await interaction.reply({ content: response, ephemeral: true });
}