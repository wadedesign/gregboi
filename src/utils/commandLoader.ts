// src/utils/commandLoader.ts
import { Collection, CommandInteraction } from 'discord.js';
import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import fs from 'fs';
import path from 'path';

function loadCommandFiles(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      loadCommandFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

export function loadCommands(commandsPath: string) {
  const commands = new Collection<string, { data: RESTPostAPIApplicationCommandsJSONBody, execute: (interaction: CommandInteraction) => Promise<void> }>();
  const commandFiles = loadCommandFiles(commandsPath);
  const commandDataArray: RESTPostAPIApplicationCommandsJSONBody[] = [];
  const commandNames = new Set<string>();

  for (const file of commandFiles) {
    try {
      const command = require(file);
      
      if (!command.data || !command.execute) {
        console.warn(`[WARNING] The command at ${file} is missing a required "data" or "execute" property.`);
        continue;
      }

      if (typeof command.data.name !== 'string') {
        console.warn(`[WARNING] The command at ${file} has an invalid "data.name" property. It should be a string.`);
        continue;
      }

      if (commandNames.has(command.data.name)) {
        console.warn(`[WARNING] Duplicate command name "${command.data.name}" found in ${file}. Skipping this command.`);
        continue;
      }

      commandNames.add(command.data.name);
      commands.set(command.data.name, command);
      commandDataArray.push(command.data.toJSON());
    } catch (error) {
      console.error(`[ERROR] Failed to load command from file ${file}:`, error);
    }
  }

  return { commands, commandDataArray };
}