import { showSelectMenu } from "components/ui/menus/menuItems";
import { SyncMetadataModal } from "components/ui/modals/syncMetadataModal";
import {
  initiateContextIfNotExists, removeSourceFromTag
} from "dispatch/mdb";
import i18n from "i18n";
import { uniq } from "lodash";
import MakeMDPlugin from "main";
import { Menu } from "obsidian";
import React, { useContext } from "react";
import { DBTable } from "types/mdb";
import {
  loadTags,
  tagContextFromTag,
  tagFromString
} from "utils/contexts/contexts";
import {
  frontMatterForFile, guestimateTypes,
  mergeTableData,
  parseFrontMatter
} from "utils/contexts/fm";
import { consolidateRowsToTag } from "utils/contexts/mdb";
import { getAbstractFileAtPath, openTag } from "utils/file";
import { uiIconSet } from "utils/icons";
import { MDBContext } from "../MDBContext";
export const TagSelector = (props: { plugin: MakeMDPlugin }) => {
  const {
    data,
    tagContexts,
    dbFileExists,
    setContextTable,
    saveDB,
    tableData,
    contextTable,
    dbSchema,
    dbPath,
    saveContextDB,
    saveSchema,
    loadContextFields,
  } = useContext(MDBContext);
  const removeContext = (value: string[]) => {
    const removeTags = value.map((f) => tagFromString(f));
    const tags = tagContexts.filter((f) => !removeTags.some((t) => t == f));
    removeTags.forEach((t) => {
      removeSourceFromTag(props.plugin, t, dbPath);
    });
    saveSchema({
      ...dbSchema,
      def: tags.join("&"),
    });
  };
  const saveContexts = async (_: string[], value: string[]) => {
    const tags = uniq([...tagContexts, ...value.map((f) => tagFromString(f))]);
    tags.forEach((tag) => {
      initiateContextIfNotExists(props.plugin, tag)
        .then((f) => {
          if (f) {
            return consolidateRowsToTag(
              props.plugin,
              tagContextFromTag(props.plugin, tag),
              dbSchema.id,
              dbPath,
              tableData.rows
            );
          }
        })
        .then((f) => loadContextFields(tag));
    });
    saveSchema({
      ...dbSchema,
      def: tags.join("&"),
    });
  };
  const showContextMenu = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const f = loadTags(props.plugin);
    showSelectMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        multi: false,
        editable: true,
        value: [],
        options: f.map((m) => ({ name: m, value: m })),
        saveOptions: saveContexts,
        placeholder: i18n.labels.contextItemSelectPlaceholder,
        searchable: true,
        showAll: true,
      }
    );
  };
  const showTagMenu = (e: React.MouseEvent, tag: string) => {
    const menu = new Menu();
    menu.addItem((menuItem) => {
      menuItem.setIcon("hash");
      menuItem.setTitle(i18n.menu.openTag);
      menuItem.onClick(() => {
        openTag(tag, props.plugin, e.metaKey);
      });
    });
    menu.addItem((menuItem) => {
      menuItem.setIcon("trash");
      menuItem.setTitle(i18n.menu.removeTag);
      menuItem.onClick(() => {
        removeContext([tag]);
      });
    });

    const offset = (e.target as HTMLElement).getBoundingClientRect();
    menu.showAtPosition({ x: offset.left, y: offset.top + 30 });
  };

  const saveMetadata = (keys: string[], table: string) => {
    const files = data.map((f) => f.File);
    const importYAML = (files: string[], fmKeys: string[]): DBTable => {
      return files
        .map((f) => getAbstractFileAtPath(app, f))
        .filter((f) => f)
        .reduce(
          (p, c) => {
            const fm = frontMatterForFile(c);
            if (!fm) {
              return p;
            }

            return {
              uniques: [],
              cols: uniq([...p.cols, ...fmKeys]),
              rows: [
                ...p.rows,
                {
                  File: c.path,
                  ...fmKeys.reduce(
                    (p, c) => ({
                      ...p,
                      [c]: parseFrontMatter(c, fm[c], false),
                    }),
                    {}
                  ),
                },
              ],
            };
          },
          { uniques: [], cols: [], rows: [] }
        );
    };

    const yamlTableData = importYAML(files, keys);
    const yamlTypes = guestimateTypes(files, false);

    if (table == "") {
      const newTable = mergeTableData(tableData, yamlTableData, yamlTypes);
      saveDB(newTable);
    } else {
      if (!dbFileExists) {
        saveDB(tableData).then(() =>
          saveContext(yamlTableData, yamlTypes, table)
        );
      } else {
        saveContext(yamlTableData, yamlTypes, table);
      }
    }
  };

  const saveContext = (
    yamlTableData: DBTable,
    yamlTypes: Record<string, string>,
    table: string
  ) => {
    if (contextTable[table]) {
      const newTable = mergeTableData(
        contextTable[table],
        yamlTableData,
        yamlTypes
      );
      saveContextDB(newTable, table);
      saveSchema({
        ...dbSchema,
        def: uniq([...tagContexts, table]).join("&"),
      });
    } else {
      consolidateRowsToTag(
        props.plugin,
        tagContextFromTag(props.plugin, table),
        dbSchema.id,
        dbPath,
        tableData.rows
      )
        .then((f) => {
          if (f) {
            const newTable = mergeTableData(f, yamlTableData, yamlTypes);
            return saveContextDB(newTable, table);
          }
        })
        .then(() => {
          saveSchema({
            ...dbSchema,
            def: uniq([...tagContexts, table]).join("&"),
          });
        });
    }
  };
  const syncMetadata = () => {
    let vaultChangeModal = new SyncMetadataModal(
      props.plugin,
      data.map((f) => getAbstractFileAtPath(app, f.File)).filter((f) => f),
      saveMetadata
    );
    vaultChangeModal.open();
  };
  return (
    <div className="mk-tag-selector">
      {tagContexts.map((f) => (
        <button
          onContextMenu={(e) => showTagMenu(e, f)}
          onClick={(e) => openTag(f, props.plugin, e.metaKey)}
        >
          {f}
        </button>
      ))}
      <button aria-label={i18n.buttons.addTag} onClick={(e) => showContextMenu(e)}>
        <div
          className="mk-icon-xsmall"
          dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-plus"] }}
        ></div>
        {!dbFileExists ? i18n.buttons.tag : ''}
      </button>
      <button aria-label={i18n.buttons.syncFields} onClick={(e) => syncMetadata()}>
        <div
          className="mk-icon-xsmall"
          dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-sync"] }}
        ></div>
        {!dbFileExists ? i18n.buttons.syncFields : ''}
      </button>
    </div>
  );
};
