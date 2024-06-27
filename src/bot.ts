import { Client, GatewayIntentBits, REST, Routes, Interaction, Events, Collection, ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import { loadCommands } from './utils/commandLoader';
import { loadContextMenus } from './utils/contextMenuLoader';
import messageModeration from './events/gregmod';

dotenv.config();

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

const commandsPath = path.join(__dirname, 'commands');
const contextMenusPath = path.join(__dirname, 'commands', 'contextMenus');
const { commands, commandDataArray } = loadCommands(commandsPath);
const { contextMenus, contextMenuDataArray } = loadContextMenus(contextMenusPath);

const allNames = new Set<string>();
const finalCommandDataArray = [...commandDataArray, ...contextMenuDataArray].filter(cmd => {
    if (allNames.has(cmd.name)) {
        return false;
    }
    allNames.add(cmd.name);
    return true;
});

client.commands = commands;
client.contextMenus = contextMenus;

client.once('ready', async () => {
    console.log(`Logged in as ${client.user?.tag}`);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN || '');

    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(client.user!.id),
            { body: finalCommandDataArray },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    } else if (interaction.isContextMenuCommand()) {
        const contextMenu = client.contextMenus.get(interaction.commandName);

        if (!contextMenu) {
            console.error(`No context menu matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await contextMenu.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this context menu command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this context menu command!', ephemeral: true });
            }
        }
    }
});

messageModeration(client);

client.login(process.env.DISCORD_TOKEN);
