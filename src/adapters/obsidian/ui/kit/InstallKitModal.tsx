import { installSpaceKit } from "adapters/obsidian/ui/kit/kits";
import MakeMDPlugin from "main";
import { Superstate } from "makemd-core";
import React, { useState } from "react";
import { windowFromDocument } from "utils/dom";
import { safelyParseJSON } from "utils/parsers";
import { Dropdown } from "../../../../core/react/components/UI/Dropdown";
import { showSpacesMenu } from "../../../../core/react/components/UI/Menus/properties/selectSpaceMenu";

export const installKitModal = (
  plugin: MakeMDPlugin,
  superstate: Superstate,
  kit: string,
  win: Window
) => {
  superstate.ui.openModal(
    "Add Kit",
    (props: { hide: () => void }) => (
      <InstallKit
        plugin={plugin}
        superstate={superstate}
        hide={props.hide}
        kit={kit}
      ></InstallKit>
    ),
    win
  );
};

export const InstallKit = (props: {
  plugin: MakeMDPlugin;
  superstate: Superstate;
  hide: () => void;
  kit: string;
}) => {
  const [kit, setKit] = useState(props.kit);
  const [space, setSpace] = useState<string>("/");
  const installKit = () => {
    if (!kit.startsWith("https://www.make.md/static/kits/")) {
      props.superstate.ui.notify("Invalid Kit URL");
      return;
    }
    fetch(kit)
      .then((f) => f.text())
      .then((f) => {
        if (!f) {
          props.superstate.ui.notify("Kit doesn't exist");
          return;
        }
        console.log("Adding Kit");
        return installSpaceKit(
          props.plugin,
          props.superstate,
          safelyParseJSON(f),
          space
        );
      })
      .then((f) => {
        props.superstate.ui.notify("Kit added");
        props.hide();
      });
  };
  return (
    <div>
      <div className="setting-item">
        <div className="setting-item-heading">Kit Location</div>
        <span></span>
        <input
          type="text"
          value={kit}
          onChange={(e) => setKit(e.target.value)}
        ></input>
      </div>
      <div className="setting-item">
        <div className="setting-item-heading">Add Kit to Space</div>
        <span></span>
        <Dropdown
          superstate={props.superstate}
          triggerMenu={(e) => {
            const offset = (
              e.target as HTMLButtonElement
            ).getBoundingClientRect();
            showSpacesMenu(
              offset,
              windowFromDocument(e.view.document),
              props.superstate,
              (link) => setSpace(link)
            );
          }}
          value={props.superstate.spacesIndex.get(space)?.name}
          selectValue={(value) => {
            setSpace(value);
          }}
        ></Dropdown>
      </div>
      <div className="setting-item">
        <button onClick={() => installKit()}>Add</button>
        <button onClick={props.hide}>Cancel</button>
      </div>
    </div>
  );
};
