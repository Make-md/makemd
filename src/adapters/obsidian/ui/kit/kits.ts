
import { getMDBTables } from "adapters/mdb/utils/mdb";
import { regexYaml } from "adapters/text/textCacher";
import { createSpace, newPathInSpace, parseSpaceMetadata, saveProperties } from "core/superstate/utils/spaces";
import { PathPropertyName } from "core/types/context";
import { SpaceDefinition, SpaceType } from "core/types/space";
import MakeMDPlugin from "main";
import { Superstate } from "makemd-core";
import { parseYaml } from "obsidian";
import { defaultFrameSchema } from "schemas/frames";
import { defaultContextSchemaID, fieldSchema } from "schemas/mdb";
import { Note, SpaceKit, TemplateKit } from "types/kits";
import { DBTables, FilesystemSpaceInfo, SpaceTables } from "types/mdb";
import { safelyParseJSON } from "utils/parsers";

export const installSpaceTemplate = async (plugin: MakeMDPlugin, superstate: Superstate, space: string, template: TemplateKit) => {
    
    if (template.type === 'folder') {
        if (template.content as SpaceKit)
            await installSpaceKit(plugin, superstate, template.content as SpaceKit, `${space}/${plugin.superstate.settings.spaceSubFolder}/templates`, true);
    } else {
        await plugin.files.writeTextToFile(`${space}/${plugin.superstate.settings.spaceSubFolder}/templates/${template.name}`, template.content as string);
    }

}

export const mdbFramesToDBTables = (tables: SpaceTables) : DBTables => {
    const schemas = Object.values(tables).map((t) => t.schema);
    const fields = Object.values(tables).flatMap((t) => t.cols);
    const dbTables = Object.keys(tables).reduce((p, c) => {
      return {
        ...p,
        [c]: {
          uniques: defaultFrameSchema.uniques,
          cols: defaultFrameSchema.cols,
          rows: tables[c].rows
        },
      };
    }, {}) as DBTables;
    return {
      ...dbTables,
      m_schema: {
        uniques: [],
        cols: ["id", "name", "type", "def", "predicate", "primary"],
        rows: schemas
      },
      m_fields: {
        uniques: fieldSchema.uniques,
                      cols: fieldSchema.cols,
        rows: fields}
    }
    
  }

export const mdbToDBTables = (tables: SpaceTables) : DBTables => {
    const schemas = Object.values(tables).map((t) => t.schema);
    const fields = Object.values(tables).flatMap((t) => t.cols);
    const dbTables = Object.keys(tables).reduce((p, c) => {
      return {
        ...p,
        [c]: {
          uniques: [],
          cols: tables[c].cols.map((f) => f.name),
          rows: tables[c].rows
        },
      };
    }, {}) as DBTables;
    return {
      ...dbTables,
      m_schema: {
        uniques: [],
        cols: ["id", "name", "type", "def", "predicate", "primary"],
        rows: schemas
      },
      m_fields: {
        uniques: fieldSchema.uniques,
                      cols: fieldSchema.cols,
        rows: fields}
    }
    
  }

export const installSpaceKit = async (plugin: MakeMDPlugin, superstate: Superstate, kit: SpaceKit, space: string, isTemplate?: boolean) => {
    if (!kit) return;

    const path = space == '/' ? kit.name : space + '/' + kit.name;
    let newSpace;
    if (isTemplate) {
        await plugin.files.createFolder(path);
        newSpace = {
            name: kit.name,
            type: 'folder' as SpaceType,
            path: path,
            space: {
                path: path,
                name: kit.name,
                isRemote: false,
                readOnly: false,
                defPath: `${path}/${plugin.superstate.settings.spaceSubFolder}/def.json`,
                notePath: `${path}/${kit.name}.md`,
                dbPath: `${path}/${plugin.superstate.settings.spaceSubFolder}/context.mdb`,
                framePath: `${path}/${plugin.superstate.settings.spaceSubFolder}/views.mdb`,
            } as FilesystemSpaceInfo
        }
    } else {
        newSpace = await createSpace(superstate, path, kit.definition);
        await saveProperties(superstate, newSpace.path, kit.properties);
    }
    
    if (kit.content) {
        await plugin.files.writeTextToFile(newSpace.space.notePath, kit.content);
    }
    if (kit.frames) {
        const framePath = (newSpace.space as FilesystemSpaceInfo).framePath;
        plugin.mdbFileAdapter.newContent({
            path: framePath,
            isFolder: false,
            name: 'frames',
            parent: '',
            filename: 'views.mdb',
        }, 'tables', '', mdbFramesToDBTables(kit.frames), {});
    }
    if (kit.context)
        {
            const dbPath = (newSpace.space as FilesystemSpaceInfo).dbPath;
        plugin.mdbFileAdapter.newContent({
            path: dbPath,
            isFolder: false,
            name: 'context',
            parent: '',
            filename: 'context.mdb',
        }, 'tables', '', mdbToDBTables(kit.context), {});

        }
        if (kit.templates?.length > 0) {
            await plugin.files.createFolder(`${space}/${plugin.superstate.settings.spaceSubFolder}/templates`);
            for (const template of kit.templates) {
                await installSpaceTemplate(plugin, superstate, newSpace.path, template);
            }
        }
    for (const note of kit.notes) {
        if (isTemplate) {
            await plugin.files.writeTextToFile(newSpace.path+'/'+note.name, note.content);
        } else {
            newPathInSpace(superstate, newSpace, "md", note.name, true, note.content);
        }
    }
    for (const child of kit.children) {
        await installSpaceKit(plugin, superstate, child, newSpace.path, isTemplate);
    }
    if (!isTemplate) {
        await superstate.reloadSpaceByPath(newSpace.path);
    }
}

export const absolutePathToRelativePath = (path: string, absolutePath: string) => {
    
    const relativePath = path.replace(absolutePath, '');
    if (relativePath.startsWith('/')) {
        return '.' + relativePath;
    } else {
        const levelsUp = absolutePath.split('/').length;
        const relativePrefix = levelsUp > 0 ? '../'.repeat(levelsUp) : '';
        return relativePrefix + relativePath;
    }
}

export const contextPathsToRelativePaths = (context: SpaceTables, contextPath: string) => {
    const newContext = {...context};
        context[defaultContextSchemaID].rows = context[defaultContextSchemaID].rows.map((r) => {
            r[PathPropertyName] = absolutePathToRelativePath(r[PathPropertyName], contextPath);
            return r;
        })
    return newContext;
}

export const exportSpaceKit = async (plugin: MakeMDPlugin, superstate: Superstate, space: string, root: string) => {
    const spaceCache = superstate.spacesIndex.get(space);
    let name : string;
    let context : SpaceTables;
    let frames : SpaceTables;
    let properties: Record<string, string>;
    let definition : SpaceDefinition;
    const children : SpaceKit[] = [];
    const notes : Note[] = [];
    const templates : TemplateKit[] = [];
    let content: string;
    if (spaceCache) {
        name = spaceCache.name;
        definition = spaceCache.metadata;
        context = await superstate.spaceManager.readAllTables(space);
        content = await superstate.spaceManager.readPath(spaceCache.space.notePath);
        frames = await superstate.spaceManager.readAllFrames(space);
        properties = Object.keys(spaceCache.properties).reduce((p, c) => {
            return {
                ...p,
                [c]: spaceCache.properties[c]
            }
        }, {})
        const subSpaces = [...superstate.spacesMap.getInverse(space)];
    
            for(const f of subSpaces)  {
                if (superstate.spacesIndex.has(f)) {
                    const child = await exportSpaceKit(plugin, superstate, f, root);
                    children.push(child)
                } else {
                    const note = superstate.pathsIndex.get(f);
                    const content = await superstate.spaceManager.readPath(f);
                    notes.push({
                        name: note.name,
                        properties: {},
                        content: content
                    })
                }
            }

    for (const template of spaceCache.templates) {
        const path = `${spaceCache.path}/${plugin.superstate.settings.spaceSubFolder}/templates/${template}`;
        const templateItem = await superstate.spaceManager.getPathInfo(path);
        
        if (template.startsWith('.')) continue;
        if (templateItem.isFolder) {
            const templateSpace = await exportSpaceKit(plugin, superstate, path, root);
            templates.push({
                name: templateItem.name,
                type: 'folder',
                content: templateSpace
            });
        } else {
            const content = await superstate.spaceManager.readPath(path);
            templates.push({
                name: templateItem.name,
                type: 'file',
                content: content
            });
        }
    }
    } else {
        const spaceInfo = await superstate.spaceManager.spaceInfoForPath(space);
        name = spaceInfo.name;
        const defContent = await superstate.spaceManager.readPath(spaceInfo.defPath);
        const noteContent = await superstate.spaceManager.readPath(spaceInfo.notePath);
        content = noteContent;
        if (noteContent) {            
            const match = defContent.match(regexYaml);
            if (match) {
                const yamlContent = match[1];
                properties = parseYaml(yamlContent)
            }
        }
        if (defContent) {
            definition = parseSpaceMetadata(safelyParseJSON(defContent), superstate.settings);
        }
        context = await getMDBTables(plugin.mdbFileAdapter, (spaceInfo as FilesystemSpaceInfo).dbPath)
        frames = await getMDBTables(plugin.mdbFileAdapter, (spaceInfo as FilesystemSpaceInfo).framePath)

        const subSpaces = await superstate.spaceManager.childrenForPath(space, 'folder');
        for(const f of subSpaces)  {

                const child = await exportSpaceKit(plugin, superstate, f, root);
                children.push(child)
        }
        const files = await superstate.spaceManager.childrenForPath(space, 'file');
        for(const f of files)  {
            const name = f.split('/').pop();
            if (name.startsWith('.')) continue;
            const content = await superstate.spaceManager.readPath(f);
            notes.push({
                name: name,
                properties: {},
                content: content
            })
        }
    }
    
    
    
    const spaceKit: SpaceKit = {
        name: name,
        path: absolutePathToRelativePath(space, root),
        definition: definition,
        properties: properties,
        context: contextPathsToRelativePaths(context, space),
        frames: frames,
        children: children,
        content: content,
        notes: notes,
        assets: [],
        templates: templates
    };
    return spaceKit;
}