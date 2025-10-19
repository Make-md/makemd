import { PropertiesView } from "core/react/components/Explorer/PropertiesView";
import { PathCrumb } from "core/react/components/UI/Crumbs/PathCrumb";
import { showNewPropertyMenu } from "core/react/components/UI/Menus/contexts/newSpacePropertyMenu";
import { showPropertyMenu } from "core/react/components/UI/Menus/contexts/spacePropertyMenu";
import { defaultMenu } from "core/react/components/UI/Menus/menu/SelectionMenu";
import { showSpacesMenu } from "core/react/components/UI/Menus/properties/selectSpaceMenu";
import { InputModal } from "core/react/components/UI/Modals/InputModal";
import { CollapseToggle } from "core/react/components/UI/Toggles/CollapseToggle";
import { PathContext } from "core/react/context/PathContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import {
  createSpace,
  saveNewProperty,
  saveProperties,
} from "core/superstate/utils/spaces";
import { addTagToPath } from "core/superstate/utils/tags";
import { FMMetadataKeys } from "core/types/space";
import { updateContextValue } from "core/utils/contexts/context";
import { SelectOption, Superstate } from "makemd-core";
import i18n from "shared/i18n";
import React, {
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { defaultContextSchemaID } from "shared/schemas/context";
import { PathPropertyName } from "shared/types/context";
import { SpaceProperty, SpaceTables } from "shared/types/mdb";
import { windowFromDocument } from "shared/utils/dom";
import { parseMDBStringValue } from "utils/properties";
import { DataPropertyView } from "../DataTypeView/DataPropertyView";
import { CellEditMode } from "../TableView/TableView";
import { uniq } from "shared/utils/array";

type PathContextProperty = {
  property: SpaceProperty;
  contexts: string[];
  value: string;
};
export const HeaderPropertiesView = (props: PropsWithChildren<{
  superstate: Superstate;
  collapseSpaces: boolean;
}>) => {
  const [collapsed, setCollapsed] = useState(
    !props.superstate.settings.inlineContextExpanded || !props.collapseSpaces
  );
  useEffect(() => {
    props.superstate.settings.inlineContextExpanded = !collapsed;
    props.superstate.saveSettings();
  }, [collapsed]);

  const [contextTable, setContextTable] = useState<SpaceTables>({});

  const { spaceState } = useContext(SpaceContext);
  const { addToSpace, readMode, removeFromSpace, pathState } =
    useContext(PathContext);

  const isSpace = pathState.type == "space";
  const showContextMenu = (e: React.MouseEvent, path: string) => {
    const space = props.superstate.spacesIndex.get(path);
    if (!space) return;

    let spaceIsInherited = false;
    if (
      space.type == "tag" &&
      !(pathState.metadata?.tags ?? []).includes(space.space.name)
    ) {
      spaceIsInherited = true;
    }
    if (space.type == "folder" && (pathState.liveSpaces ?? []).includes(path)) {
      spaceIsInherited = true;
    }

    e.preventDefault();
    const menuOptions: SelectOption[] = [];
    menuOptions.push({
      name: i18n.menu.openSpace,
      icon: "ui//layout-grid",
      onClick: (e) => {
        props.superstate.ui.openPath(space.path, e.metaKey);
      },
    });
    menuOptions.push({
      name: i18n.labels.newProperty,
      icon: "ui//plus",
      onClick: (e) => {
        newProperty(e, space.path);
      },
    });

    if (removeFromSpace && !spaceIsInherited)
      menuOptions.push({
        name: i18n.menu.removeFromSpace.replace("${1}", space.name),
        icon: "ui//trash",
        onClick: (e) => {
          removeFromSpace(space.path);
        },
      });

    const offset = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      offset,
      defaultMenu(props.superstate.ui, menuOptions),
      windowFromDocument(e.view.document)
    );
  };

 

  const spacePathStates = useMemo(
    () =>uniq([pathState.parent, ...props.superstate.spacesMap.get(pathState.path)])
      .map((f) => props.superstate.spacesIndex.get(f))
      .filter((f) => f && f.type != "default" && f.path != "/")
      .map((f) => props.superstate.pathsIndex.get(f.path))
      .sort((f, k) =>
        pathState.path.startsWith(f.path) ? -1 : pathState.path.startsWith(k.path) ? 1 : 0
      )
      .filter((f) => f), 
    [pathState]
  );
  const spaces = useMemo(
    () =>
      [...(props.superstate.spacesMap.get(pathState?.path) ?? [])]
        .map((f) => props.superstate.spacesIndex.get(f)?.space)
        .filter((f) => f),
    [pathState]
  );

  const saveField = (source: string, field: SpaceProperty) => {
    if (source == "$fm") {
      saveNewProperty(props.superstate, pathState.path, field);
      return true;
    }
    props.superstate.spaceManager.addSpaceProperty(source, field);
    return true;
  };

  const newProperty = (e: React.MouseEvent, space: string) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();

    showNewPropertyMenu(
      props.superstate,
      offset,
      windowFromDocument(e.view.document),
      {
        spaces: spacePathStates.map((f) => f.path),
        fields: [],
        saveField: (source: string, field: SpaceProperty) =>
          saveField(source, field),
        schemaId: defaultContextSchemaID,
        contextPath: space,
        fileMetadata: true,
      }
    );
  };

  const showAddMenu = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
    showSpacesMenu(
      offset,
      windowFromDocument(e.view.document),
      props.superstate,
      (link: string, isNew: boolean, type: string) => {
        if (isNew) {
          if (link.charAt(0) == "#" || type == "tag") {
            addTagToPath(props.superstate, pathState.path, link);
          } else {
            createSpace(props.superstate, link, { links: [pathState.path] });
          }
        } else {
          addToSpace(link);
        }
      },
      false,
      true
    );
  };

  const newAction = (e: React.MouseEvent) => {
    props.superstate.ui.openModal(
      i18n.labels.newAction,
      <InputModal
        value=""
        saveLabel={i18n.buttons.save}
        saveValue={(value) => {
          props.superstate.spaceManager.createCommand(spaceState.path, {
            id: value,
            name: value,
            type: "actions",
          });
        }}
      ></InputModal>,
      windowFromDocument(e.view.document)
    );
  };

  const [cols, setCols] = useState<PathContextProperty[]>([]);
  useEffect(() => {
    reloadProperties();
  }, [pathState]);
  useEffect(() => {
    const contextUpdated = (payload: { path: string }) => {
      const spaces = [
        ...(props.superstate.spacesMap.get(pathState?.path) ?? []),
      ];
      if (!spaces.includes(payload.path)) return;
      reloadProperties();
    };
    props.superstate.eventsDispatcher.addListener(
      "contextStateUpdated",
      contextUpdated
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "contextStateUpdated",
        contextUpdated
      );
    };
  }, [pathState]);
  const reloadProperties = async () => {
    const spaces = [...(props.superstate.spacesMap.get(pathState?.path) ?? [])];
    const contexts = await Promise.all(
      spaces.map(async (f) =>
        props.superstate.spaceManager
          .readTable(f, defaultContextSchemaID)
          .then((g) => ({
            path: f,
            schema: g.schema,
            cols: g.cols,
            rows: g.rows,
          }))
      )
    );
    const contextTags = spaces.flatMap(
      (f) => props.superstate.spacesIndex.get(f)?.contexts
    );
    const relationContexts = cols
      .filter((f) => f.property.type.startsWith("context"))
      .map((f) => {
        const value = parseFieldValue(f.property.value, f.property.type);
        return value.space;
      })
      .filter((f) => f);
    const contextData = await Promise.all(
      [...contextTags, ...relationContexts]
        .filter((f) => !spaces.includes(f))
        .map((f) => {
          return props.superstate.spaceManager
            .readTable(f, defaultContextSchemaID)
            .then((g) => ({ [f]: g }));
        })
    );
    const contextTable = contextData.reduce((p, c) => {
      return { ...p, ...c };
    }, {});

    setContextTable({
      ...contextTable,
      ...contexts.reduce((p, c) => {
        return {
          ...p,
          [c.path]: {
            schema: c.schema,
            cols: c.cols,
            rows: c.rows,
          },
        };
      }, {}),
    });
    const properties: PathContextProperty[] = [];
    
    contexts.forEach((f) => {
      const row = f.rows.find((g) => props.superstate.spaceManager.resolvePath(g[PathPropertyName], f.path)  == pathState.path);
      f.cols
        .filter((f) => f.primary != "true")
        .forEach((g) => {
          const index = properties.findIndex((h) => h.property.name == g.name);
          if (index == -1) {
            properties.push({
              property: g,
              contexts: [f.path],
              value: row?.[g.name] ?? "",
            });
          } else {
            properties[index].contexts.push(f.path);
          }
        });
    }, []);
    setCols(properties);
  };
  const updateValue = (value: string, field: PathContextProperty) => {
    saveProperties(props.superstate, pathState.path, {
      [field.property.name]: parseMDBStringValue(
        field.property.type,
        value,
        true
      ),
    });
    Promise.all(
      field.contexts.map((f) => {
        updateContextValue(
          props.superstate.spaceManager,
          props.superstate.spacesIndex.get(f).space,
          pathState.path,
          field.property.name,
          value
        );
      })
    );
  };
  const updateFieldValue = (
    fv: string,
    value: string,
    field: PathContextProperty
  ) => {
    saveProperties(props.superstate, pathState.path, {
      [field.property.name]: parseMDBStringValue(
        field.property.type,
        value,
        true
      ),
    });

    props.superstate.spaceManager.saveSpaceProperty(
      field.contexts[0],
      {
        ...field.property,
        value: fv,
      },
      field.property
    );
  };
  const showMenu = (e: React.MouseEvent, field: PathContextProperty) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    showPropertyMenu({
      superstate: props.superstate,
      field: field.property,
      rect: offset,
      win: windowFromDocument(e.view.document),
      options: [],
      fields: cols.map((f) => f.property),
      contextPath: pathState.path,
      saveField: (newField) => {
        props.superstate.spaceManager.saveSpaceProperty(
          field.contexts[0],
          newField,
          field.property
        );
      },
      anchor: "bottom",
      deleteColumn: (column) => {
        props.superstate.spaceManager.deleteSpaceProperty(
          field.contexts[0],
          field.property
        );
      },
      editable: true,
    });
  };
  const [isPending, startTransition] = useTransition();
  useEffect(() => {
    startTransition(() => null);
  }, []);
  const toggleCollapsed = () => {
    startTransition(() => setCollapsed((f) => !f));
  };
  const excludedKeys = [...FMMetadataKeys(props.superstate.settings)];
  return (
    <div className="mk-props-contexts">
      {!readMode && props.collapseSpaces && (
        <div style={{ position: "relative" }}>
          <div className="mk-fold">
            <CollapseToggle
              superstate={props.superstate}
              collapsed={collapsed}
              onToggle={(c) => toggleCollapsed()}
            ></CollapseToggle>
          </div>
        </div>
      )}
      {props.collapseSpaces && (
        <div className="mk-path-context-row">
          <div className="mk-props-contexts-space-list">
            {spacePathStates.map((f, i) => (
              <div
                key={i}
                className="mk-props-contexts-space-name"
                onContextMenu={(e) => showContextMenu(e, f.path)}
                onClick={(e) => props.superstate.ui.openPath(f.path, e.metaKey)}
                style={
                  f.label?.color?.length > 0
                    ? ({
                        "--tag-background": f.label?.color,
                        "--tag-color": "var(--color-white)",
                      } as React.CSSProperties)
                    : {}
                }
              >
                <div
                  className={`mk-icon-xsmall`}
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker(f.label?.sticker),
                  }}
                ></div>
                {f.name}
              </div>
            ))}
            <div
              className="mk-props-contexts-space-name"
              onClick={(e) => showAddMenu(e)}
              style={
                {
                  opacity: 0.5,
                } as React.CSSProperties
              }
            >
              <span
                className="mk-icon-xsmall"
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//space-add"),
                }}
              ></span>
              {i18n.labels.spaces}
            </div>
            <span style={{flex: 1}}></span>{props.children}
          </div>
        </div>
      )}
      {(!collapsed || !props.collapseSpaces || isPending) && (
        <div
          className="mk-header-space"
          style={{
            transition: "all 0.3s ease-in-out",
            maxHeight: isPending ? "0px" : "unset",
          }}
        >
          {!props.collapseSpaces && (
            <div className="mk-path-context-row">
              <div className="mk-path-context-field">
                <div
                  className="mk-path-context-field-icon"
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker("ui//file-stack"),
                  }}
                ></div>
                <div className="mk-path-context-field-key">{i18n.labels.spaces}</div>
              </div>
              <div className="mk-path-context-value">
                <div className="mk-props-value">
                  <div className="mk-props-list">
                    {spacePathStates.map((f, i) => (
                      <PathCrumb
                        key={i}
                        superstate={props.superstate}
                        path={f.path}
                      ></PathCrumb>
                    ))}
                  </div>
                </div>
              </div>
              
            </div>
          )}

          {cols.map((f, i) => (
            <DataPropertyView
              key={i}
              superstate={props.superstate}
              initialValue={f.value}
              row={{
                [PathPropertyName]: pathState.path,
                ...pathState.metadata.property,
              }}
              compactMode={false}
              column={{ ...f.property, table: "" }}
              columns={cols.map((f) => f.property)}
              editMode={CellEditMode.EditModeAlways}
              updateValue={(v) => updateValue(v, f)}
              updateFieldValue={(fv, v) => updateFieldValue(fv, v, f)}
              contextTable={contextTable}
              source={pathState.path}
              path={pathState.path}
              contexts={f.contexts}
              propertyMenu={(e) => showMenu(e, f)}
              contextPath={f.contexts[0]}
            ></DataPropertyView>
          ))}

          <PropertiesView
            superstate={props.superstate}
            spaces={spaces.map((f) => f.path)}
            force={true}
            compactMode={false}
            excludeKeys={[
              ...excludedKeys,
              props.superstate.settings.fmKeyAlias,
            ]}
            editable={true}
          ></PropertiesView>
          <div className="mk-path-context-row-new">
            <div
              className="mk-path-context-new"
              onClick={(e) => newProperty(e, "$fm")}
            >
              <div
                className="mk-path-context-field-icon"
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//plus"),
                }}
              ></div>
              <div className="mk-path-context-field-key">
                {i18n.labels.newProperty}
              </div>
            </div>
          </div>
        </div>
      )}
      {excludedKeys.length > 0 && (
        <style>
          {`${excludedKeys
            .map((f) => `.metadata-property[data-property-key="${f}"]`)
            .join(", ")}
      {
         display: none;
      }`}
        </style>
      )}
    </div>
  );
};
