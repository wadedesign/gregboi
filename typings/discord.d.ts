import { Collection } from 'discord.js';
import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { CommandInteraction, ContextMenuCommandInteraction } from 'discord.js';

declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, {
      data: RESTPostAPIApplicationCommandsJSONBody,
      execute: (interaction: CommandInteraction) => Promise<void>
    }>;
    contextMenus: Collection<string, {
      data: RESTPostAPIApplicationCommandsJSONBody,
      execute: (interaction: ContextMenuCommandInteraction) => Promise<void>
    }>;
  }
}
