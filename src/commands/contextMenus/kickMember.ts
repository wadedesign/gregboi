// src/commands/contextMenus/kickMember.ts
import { ContextMenuCommandBuilder, ApplicationCommandType, UserContextMenuCommandInteraction, GuildMember, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalSubmitInteraction } from 'discord.js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

const API_TOKEN = process.env.API_TOKEN as string;
const ACCOUNT_ID = process.env.ACCOUNT_ID as string;
const GATEWAY_ID = process.env.GATEWAY_ID as string;
const MODEL = process.env.MODEL as string;
const SUPERUSER = (process.env.SUPERUSER || '').split(',');

export const data = new ContextMenuCommandBuilder()
    .setName('Kick Member')
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
    const executingUser = interaction.user;
    const targetMember = interaction.targetMember as GuildMember;

    if (!SUPERUSER.includes(executingUser.id)) {
        await interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        return;
    }

    if (!targetMember) {
        await interaction.reply({ content: 'Target user is not a member of this server.', ephemeral: true });
        return;
    }

    const modal = new ModalBuilder()
        .setCustomId('kickReasonModal')
        .setTitle('Provide Kick Reason')
        .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('kickReason')
                    .setLabel('Reason for kicking the user')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
            )
        );

    await interaction.showModal(modal);

    const filter = (i: ModalSubmitInteraction) => i.customId === 'kickReasonModal' && i.user.id === executingUser.id;

    interaction.awaitModalSubmit({ filter, time: 60000 })
        .then(async modalInteraction => {
            const reason = modalInteraction.fields.getTextInputValue('kickReason');

            await modalInteraction.deferReply({ ephemeral: true });

            try {
                const userInfo = `Username: ${targetMember.user.username}\nUser ID: ${targetMember.user.id}\nAccount Created: ${targetMember.user.createdAt.toDateString()}\nJoined Server: ${targetMember.joinedAt?.toDateString() || 'Unknown'}\nRoles: ${targetMember.roles.cache.map(role => role.name).join(', ')}`;

                const response: any = await run(MODEL, {
                    messages: [
                        {
                            role: 'system',
                            content: 'You are Greg, a helper in a discord server. You must provide a concise and professional summary of the following user information, including the reason for their kick. Keep it straight and to the point, like an officer of the law.',
                        },
                        {
                            role: 'user',
                            content: `Summarize the following user information and explain why they are being kicked:\n\n${userInfo}\nReason: ${reason}`,
                        },
                    ],
                });

                let aiMessage = 'Unable to generate a message at this time.';

                if (response && response.result && response.result.response) {
                    aiMessage = response.result.response;
                }

                await targetMember.send(aiMessage).catch(err => console.error('Failed to send DM:', err));
                await targetMember.kick(reason);
                await modalInteraction.editReply({ content: `Successfully kicked ${targetMember.user.tag} from the server.` });
            } catch (error) {
                console.error(error);
                await modalInteraction.editReply({ content: 'An error occurred while attempting to kick the member.' });
            }
        })
        .catch(err => {
            console.error('Failed to collect kick reason:', err);
            interaction.followUp({ content: 'Failed to collect kick reason in time.', ephemeral: true });
        });
}
