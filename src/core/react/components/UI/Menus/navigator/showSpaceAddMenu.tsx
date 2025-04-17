import {
  createSpace,
  defaultSpace,
  newPathInSpace,
  newTemplateInSpace,
  pinPathToSpaceAtIndex,
} from "core/superstate/utils/spaces";
import { addTag } from "core/superstate/utils/tags";
import { isString } from "lodash";
import { SelectOption, Superstate } from "makemd-core";
import React from "react";
import { default as i18n } from "shared/i18n";
import { tagsSpacePath } from "shared/schemas/builtin";
import { TargetLocation } from "shared/types/path";
import { SpaceState } from "shared/types/PathState";
import { Rect } from "shared/types/Pos";
import { windowFromDocument } from "shared/utils/dom";
import { InputModal } from "../../Modals/InputModal";
import { defaultMenu, menuSeparator } from "../menu/SelectionMenu";
import { showLinkMenu } from "../properties/linkMenu";

export const newSpaceModal = (superstate: Superstate) => {
  superstate.ui.openModal(
    i18n.labels.createSection,
    <InputModal
      saveLabel={i18n.buttons.createFolder}
      value={""}
      saveValue={(v) => {
        defaultSpace(
          superstate,
          superstate.pathsIndex.get(superstate.ui.activePath)
        ).then((space) => {
          let pathState = superstate.pathsIndex.get(space?.path);
          if (!pathState) {
            pathState = superstate.pathsIndex.get("/");
          }
          const newName = v.replace(/\//g, "");
          const parentPath =
            pathState?.subtype == "folder"
              ? pathState.path
              : pathState.parent
              ? pathState.parent
              : "/";

          const newPath =
            !parentPath || parentPath == "/"
              ? newName
              : parentPath + "/" + newName;
          if (newName.length == 0) {
            superstate.ui.notify(i18n.notice.newSpaceName);
            return;
          }
          if (superstate.spacesIndex.has(newPath)) {
            superstate.ui.notify(i18n.notice.duplicateSpaceName);
            return;
          }
          createSpace(superstate, newPath, {});
        });
      }}
    ></InputModal>,
    window
  );
};

export const defaultAddAction = async (
  superstate: Superstate,
  _space: SpaceState,
  win: Window,
  location?: TargetLocation
) => {
  let space = _space;
  if (space?.path == tagsSpacePath) {
    superstate.ui.openModal(
      "New Tag",
      <InputModal
        value=""
        saveLabel={i18n.labels.saveView}
        saveValue={(value) => addTag(superstate, value)}
      ></InputModal>,
      win
    );
    return;
  }
  if (!space || space.type == "tag") {
    space = await defaultSpace(
      superstate,
      superstate.pathsIndex.get(superstate.ui.activePath)
    );
  }
  if (space?.metadata.template?.length > 0) {
    newTemplateInSpace(superstate, space, space.metadata.template, location);
    return;
  } else {
    newPathInSpace(superstate, space, "md", null, false, null, location);
  }
};

export const showSpaceAddMenu = (
  superstate: Superstate,
  offset: Rect,
  win: Window,
  space: SpaceState,
  dontOpen?: boolean,
  isSubmenu?: boolean
) => {
  const menuOptions: SelectOption[] = [];
  if (space.type == "default") {
    menuOptions.push({
      name: "New Tag",
      icon: "ui//tags",
      onClick: (e) => {
        superstate.ui.openModal(
          "New Tag",
          <InputModal
            value=""
            saveLabel={i18n.labels.saveView}
            saveValue={(value) => addTag(superstate, value)}
          ></InputModal>,
          windowFromDocument(e.view.document)
        );
      },
    });
  } else {
    menuOptions.push({
      name: i18n.labels.createNote,
      icon: "ui//edit",
      onClick: (e) => {
        newPathInSpace(
          superstate,
          space,
          "md",
          superstate.settings.newNotePlaceholder,
          dontOpen
        );
      },
    });
    menuOptions.push({
      name: i18n.buttons.createCanvas,
      icon: "ui//layout-dashboard",
      onClick: (e) => {
        newPathInSpace(superstate, space, "canvas", null, dontOpen);
      },
    });
    menuOptions.push({
      name: i18n.labels.createSection,
      icon: "ui//folder-plus",
      onClick: (e) => {
        superstate.ui.openModal(
          i18n.labels.createSection,
          <InputModal
            saveLabel={i18n.buttons.createFolder}
            value={""}
            saveValue={(v) => {
              let pathState = superstate.pathsIndex.get(space?.path);
              if (!pathState) {
                pathState = superstate.pathsIndex.get("/");
              }
              const newName = v.replace(/\//g, "");
              const parentPath =
                pathState?.subtype == "folder"
                  ? pathState.path
                  : pathState.parent
                  ? pathState.parent
                  : "/";

              const newPath =
                !parentPath || parentPath == "/"
                  ? newName
                  : parentPath + "/" + newName;
              if (newName.length == 0) {
                superstate.ui.notify(i18n.notice.newSpaceName);
                return;
              }
              if (superstate.spacesIndex.has(newPath)) {
                superstate.ui.notify(i18n.notice.duplicateSpaceName);
                return;
              }
              createSpace(superstate, newPath, {});
            }}
          ></InputModal>,
          windowFromDocument(e.view.document)
        );
      },
    });
    if (space.type == "folder") {
      menuOptions.push({
        name: i18n.buttons.addIntoSpace,
        icon: "ui//pin",
        onClick: (e) => {
          const offset = (
            e.target as HTMLButtonElement
          ).getBoundingClientRect();
          showLinkMenu(
            offset,
            windowFromDocument(e.view.document),
            superstate,
            (link) => {
              if (isString(link)) {
                pinPathToSpaceAtIndex(superstate, space, link);
              }
            }
          );
          e.stopPropagation();
        },
      });
    }
    if (space.templates.length > 0) {
      menuOptions.push(menuSeparator);
      for (const template of space.templates) {
        menuOptions.push({
          name: template,
          icon: "ui//clipboard-pen",
          onClick: (e) => {
            newTemplateInSpace(superstate, space, template);
          },
        });
      }
    }
  }
  return superstate.ui.openMenu(
    offset,
    defaultMenu(superstate.ui, menuOptions),
    win,
    "right"
  );
};
