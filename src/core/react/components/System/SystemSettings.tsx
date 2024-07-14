import { Superstate } from "makemd-core";
import React, { useState } from "react";
import { windowFromDocument } from "utils/dom";
import { InputModal } from "../UI/Modals/InputModal";
import { IconSet } from "./IconsSet";
import { ImageSet } from "./ImageSet";
import { MaterialsSet } from "./MaterialsSet";
import { SystemActionsEditor } from "./SystemActions";
import { Templates } from "./Templates";

export type Loadout = {
  name: string;
  typography?: string;
  palette?: Record<string, string>;
  iconsSet?: string;
  defaultTemplate?: string;
  newTabSpace?: string;
  blinkSpace?: string;
  homeSpace?: string;
};
export const SystemSettings = (props: { superstate: Superstate }) => {
  const [tab, setTab] = useState(0);
  const [loadout, setLoadOut] = useState<Loadout>();
  const loadouts = props.superstate.loadouts;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        System Name
        <input
          value={props.superstate.settings.systemName}
          onChange={(e) => {
            props.superstate.settings.systemName = e.target.value;
          }}
        ></input>
        <div>
          <h2>Loadouts</h2>
          {loadouts.map((l, i) => (
            <div
              key={i}
              onClick={() => {
                setLoadOut(l);
              }}
            >
              {l.name}
            </div>
          ))}
          <button
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//plus"),
            }}
            onClick={(e) =>
              props.superstate.ui.openModal(
                "New Loadout",
                (_props: { hide: () => void }) => (
                  <InputModal
                    value={""}
                    saveLabel={"Save"}
                    hide={_props.hide}
                    saveValue={(label: string) => {
                      setLoadOut({
                        name: label,
                      });
                    }}
                  ></InputModal>
                ),
                windowFromDocument(e.view.document)
              )
            }
          ></button>
        </div>
        <div>
          Appearance
          <h2>Typography</h2>
        </div>
        Space View
        <p>Font</p>
        Palette Default New Template
        <MaterialsSet superstate={props.superstate}></MaterialsSet>
        Icons
        <IconSet superstate={props.superstate}></IconSet>
        Images
        <ImageSet superstate={props.superstate}></ImageSet>
        <Templates superstate={props.superstate}></Templates>
        <SystemActionsEditor
          superstate={props.superstate}
        ></SystemActionsEditor>
      </div>
    </div>
  );
};
