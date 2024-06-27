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
    } else if (file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

export function loadCommands(commandsPath: string) {
  const commands = new Collection<string, { data: RESTPostAPIApplicationCommandsJSONBody, execute: (interaction: CommandInteraction) => Promise<void> }>();
  const commandFiles = loadCommandFiles(commandsPath);
  const commandDataArray: RESTPostAPIApplicationCommandsJSONBody[] = [];

  for (const file of commandFiles) {
    const command = require(file);
    commands.set(command.data.name, command);
    commandDataArray.push(command.data.toJSON());
  }

  return { commands, commandDataArray };
}
