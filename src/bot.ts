// src/bot.ts
import { Client, GatewayIntentBits, REST, Routes, Interaction, CommandInteraction } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import { loadCommands } from './utils/commandLoader';
import messageModeration from './events/gregmod';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const commandsPath = path.join(__dirname, 'commands');
const { commands, commandDataArray } = loadCommands(commandsPath);
client.commands = commands;

client.once('ready', async () => {
  console.log(`Logged in as ${client.user?.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN || '');

  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(client.user!.id),
      { body: commandDataArray },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
});

client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

messageModeration(client);


client.login(process.env.DISCORD_TOKEN);
