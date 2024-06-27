// typings/discord.d.ts

import { Collection } from 'discord.js';
import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { CommandInteraction } from 'discord.js';

declare module 'discord.js' {
  // Extends the Client interface to include a commands property
  export interface Client {
    // The commands property is a Collection (like a map or dictionary)
    // where the key is a string (the name of the command) and the value 
    // is an object with two properties:
    commands: Collection<string, {
      // data contains the command structure as defined by Discord's API
      data: RESTPostAPIApplicationCommandsJSONBody,
      // execute is a function that will be called when the command is used
      // It takes a CommandInteraction object and returns a Promise that resolves to void
      execute: (interaction: CommandInteraction) => Promise<void>
    }>;
  }
}
