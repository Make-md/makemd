import { ContextViewCrumb } from "core/react/components/UI/Crumbs/ContextViewCrumb";
import {
  defaultMenu,
  menuSeparator,
} from "core/react/components/UI/Menus/menu/SelectionMenu";
import { InputModal } from "core/react/components/UI/Modals/InputModal";
import { CollapseToggle } from "core/react/components/UI/Toggles/CollapseToggle";
import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import { FramesMDBContext } from "core/react/context/FramesMDBContext";
import { PathContext } from "core/react/context/PathContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { contextViewEmbedStringFromContext } from "core/utils/contexts/embed";
import { defaultString } from "core/utils/strings";
import { SelectOption, Superstate, i18n } from "makemd-core";
import React, { useContext, useRef } from "react";
import { stickerForSchema } from "schemas/mdb";
import { FrameSchema } from "types/mframe";
import { windowFromDocument } from "utils/dom";
export const ListSelector = (props: {
  superstate: Superstate;
  expanded: boolean;
  setView?: (view: string) => void;
}) => {
  const { views, dbSchema, source } = useContext(ContextEditorContext);
  const { readMode } = useContext(PathContext);
  const { spaceState } = useContext(SpaceContext);
  const {
    frameSchema: schema,
    setFrameSchema: setSchema,
    saveSchema,
    deleteSchema,
  } = useContext(FramesMDBContext);
  const viewContextMenu = (e: React.MouseEvent, _schema: FrameSchema) => {
    const menuOptions: SelectOption[] = [];
    menuOptions.push({
      name: i18n.menu.copyEmbedLink,
      icon: "ui//link",
      onClick: (e) => {
        navigator.clipboard.writeText(
          contextViewEmbedStringFromContext(spaceState, _schema.id)
        );
      },
    });

    menuOptions.push({
      name: i18n.buttons.renameView,
      icon: "ui//edit",
      onClick: (e) => {
        props.superstate.ui.openModal(
          i18n.labels.renameView,
          (props: { hide: () => void }) => (
            <InputModal
              value={_schema.name}
              saveLabel={i18n.labels.renameView}
              hide={props.hide}
              saveValue={(value) =>
                saveSchema({
                  ..._schema,
                  name: value,
                })
              }
            ></InputModal>
          ),
          windowFromDocument(e.view.document)
        );
      },
    });

    if (views.length > 1)
      menuOptions.push({
        name: i18n.buttons.delete,
        icon: "ui//trash",
        onClick: (e) => {
          if (schema.id == _schema.id) {
            if (props.setView) {
              if (views[0].id == _schema.id) {
                props.setView(views[1].id);
                setSchema(views[1]);
              } else {
                props.setView(views[0].id);
                setSchema(views[0]);
              }
            }
          }
          deleteSchema(_schema);
        },
      });
    props.superstate.ui.openMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      defaultMenu(props.superstate.ui, menuOptions),
      windowFromDocument(e.view.document)
    );
  };
  const selectView = (value: string) => {
    setSchema(views.find((f) => f.id == value));
    if (props.setView) props.setView(value);
  };

  const ref = useRef(null);
  const showSaveViewModal = (e: React.MouseEvent) => {
    props.superstate.ui.openModal(
      i18n.labels.saveView,
      (props: { hide: () => void }) => (
        <InputModal
          value=""
          saveLabel={i18n.labels.saveView}
          hide={props.hide}
          saveValue={(value) => {
            const newSchema = {
              ...(schema ?? {
                name: dbSchema.name,
                def: {
                  db: dbSchema.id,
                },
                type: "view",
              }),
              id: value.replace(/ /g, "_"),
              name: value,
            };
            saveSchema(newSchema).then((f) => selectView(newSchema.id));
          }}
        ></InputModal>
      ),
      windowFromDocument(e.view.document)
    );
  };

  const selectViewMenu = (e: React.MouseEvent) => {
    const options: SelectOption[] = [];

    (views ?? []).forEach((f) => {
      options.push({
        name: defaultString(f.name, "Untitled"),
        value: f.id,
        icon: stickerForSchema(f),
        onClick: () => selectView(f.id),
        onMoreOptions: readMode ? null : (e) => viewContextMenu(e, f),
      });
    });
    if (!readMode) {
      options.push(menuSeparator);
      options.push({
        name: i18n.menu.newView,
        icon: "ui//plus",
        value: "",
        onClick: (e) => showSaveViewModal(e),
      });
    }
    props.superstate.ui.openMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      defaultMenu(props.superstate.ui, options),
      windowFromDocument(e.view.document),
      "bottom"
    );
  };

  return (
    dbSchema &&
    (schema ? (
      <>
        <div className="mk-view-selector" ref={ref}>
          {views.map((f, i) => (
            <ContextViewCrumb
              key={i}
              active={schema.id == f.id}
              superstate={props.superstate}
              schema={f}
              onSelect={() => setSchema(views.find((g) => g.id == f.id))}
              onContextMenu={viewContextMenu}
            ></ContextViewCrumb>
          ))}
          <button
            className="mk-toolbar-button"
            onClick={(e) => showSaveViewModal(e)}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//plus"),
            }}
          ></button>
        </div>
      </>
    ) : (
      <div onClick={(e) => selectViewMenu(e)} className="mk-context">
        <div
          className="mk-path-icon"
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//table"),
          }}
        ></div>
        {dbSchema.name}
        <CollapseToggle
          collapsed={false}
          onToggle={null}
          superstate={props.superstate}
        ></CollapseToggle>
      </div>
    ))
  );
};
