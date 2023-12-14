import { default as i18n } from "core/i18n";
import SpaceEditor from "core/react/components/Navigator/SpaceEditor";
import { isMouseEvent } from "core/react/hooks/useLongPress";
import { Superstate } from "core/superstate/superstate";
import {
  newPathInSpace,
  pinPathToSpaceAtIndex,
} from "core/superstate/utils/spaces";
import { SpaceState } from "core/types/superstate";
import React from "react";
import { SelectOption, defaultMenu, menuSeparator } from "../menu";
import { showLinkMenu } from "../properties/linkMenu";

export const showSpaceAddMenu = (
  superstate: Superstate,
  e: React.MouseEvent | React.TouchEvent,
  space: SpaceState,
  dontOpen?: boolean
) => {
  const menuOptions: SelectOption[] = [];
  menuOptions.push({
    name: i18n.labels.createNote,
    icon: "lucide//edit",
    onClick: (e) => {
      newPathInSpace(superstate, space, "md", null, dontOpen);
    },
  });
  menuOptions.push({
    name: i18n.buttons.createCanvas,
    icon: "lucide//layout-dashboard",
    onClick: (e) => {
      newPathInSpace(superstate, space, "canvas", null, dontOpen);
    },
  });
  menuOptions.push({
    name: i18n.labels.createSection,
    icon: "lucide//folder-plus",
    onClick: (e) => {
      superstate.ui.openModal(
        i18n.labels.createSection,
        (props: { hide: () => void }) => (
          <SpaceEditor
            superstate={superstate}
            space={null}
            parent={space}
            metadata={null}
            close={props.hide}
            dontOpen={dontOpen}
          ></SpaceEditor>
        )
      );
    },
  });
  menuOptions.push(menuSeparator);
  menuOptions.push({
    name: i18n.buttons.addIntoSpace,
    icon: "lucide//pin",
    onClick: (e) => {
      showLinkMenu(e, superstate, (link) => {
        pinPathToSpaceAtIndex(superstate, space, link);
      });
    },
  });
  superstate.ui.openMenu(
    isMouseEvent(e)
      ? { x: e.pageX, y: e.pageY }
      : {
          // @ts-ignore
          x: e.nativeEvent.locationX,
          // @ts-ignore
          y: e.nativeEvent.locationY,
        },
    defaultMenu(superstate.ui, menuOptions)
  );

  return false;
};
