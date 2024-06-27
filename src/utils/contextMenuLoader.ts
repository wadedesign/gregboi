// src/utils/contextMenuLoader.ts
import { Collection, ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';
import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import fs from 'fs';
import path from 'path';

export function loadContextMenus(contextMenusPath: string) {
    const contextMenus = new Collection<string, any>();
    const contextMenuDataArray: RESTPostAPIApplicationCommandsJSONBody[] = [];
    const contextMenuNames = new Set<string>();

    if (!fs.existsSync(contextMenusPath)) {
        return { contextMenus, contextMenuDataArray };
    }

    const contextMenuFiles = fs.readdirSync(contextMenusPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of contextMenuFiles) {
        const filePath = path.join(contextMenusPath, file);
        try {
            const contextMenu = require(filePath);
            if ('data' in contextMenu && 'execute' in contextMenu) {
                if (contextMenuNames.has(contextMenu.data.name)) {
                    continue;
                }
                if (!(contextMenu.data instanceof ContextMenuCommandBuilder)) {
                    continue;
                }
                contextMenuNames.add(contextMenu.data.name);
                contextMenus.set(contextMenu.data.name, contextMenu);
                contextMenuDataArray.push(contextMenu.data.toJSON());
            } else {
                console.warn(`[WARNING] The context menu at ${filePath} is missing a required "data" or "execute" property.`);
            }
        } catch (error) {
            console.error(`[ERROR] Failed to load context menu from file ${filePath}:`, error);
        }
    }

    return { contextMenus, contextMenuDataArray };
}