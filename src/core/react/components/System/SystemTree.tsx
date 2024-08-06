import { Superstate, i18n } from "makemd-core";
import React, { useEffect, useState } from "react";
import { windowFromDocument } from "utils/dom";
import { InputModal } from "../UI/Modals/InputModal";
import { CollapseToggle } from "../UI/Toggles/CollapseToggle";
export const SystemTree = (props: { superstate: Superstate }) => {
  const [libraries, setLibraries] = useState(props.superstate.actions);
  useEffect(() => {
    const listener = (f: { path: string }) => {
      if (f.path == "spaces://$actions") setLibraries(props.superstate.actions);
    };
    props.superstate.eventsDispatcher.addListener(
      "actionStateUpdated",
      listener
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "actionStateUpdated",
        listener
      );
    };
  });
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div className="mk-tree-item">Kit</div>
        <div className="mk-tree-item">Templates</div>
        <div className="mk-tree-item">Actions</div>
        {[...libraries.keys()].map((f, i) => (
          <React.Fragment key={i}>
            <div key={i} className="mk-tree-item">
              <CollapseToggle
                superstate={props.superstate}
                collapsed={true}
              ></CollapseToggle>
              <div className="mk-tree-text">{f}</div>
              <div className="mk-folder-buttons">
                <button
                  onClick={(e) => {
                    props.superstate.ui.openModal(
                      i18n.labels.newAction,

                      <InputModal
                        value=""
                        saveLabel={i18n.buttons.save}
                        saveValue={(value) => {
                          props.superstate.spaceManager.saveSystemCommand(f, {
                            schema: {
                              id: value,
                              name: value,
                              type: "action",
                            },
                            fields: [],
                            code: "",
                            codeType: "script",
                          });
                        }}
                      ></InputModal>,
                      windowFromDocument(e.view.document)
                    );
                  }}
                >
                  <div
                    className="mk-icon-xsmall"
                    dangerouslySetInnerHTML={{
                      __html: props.superstate.ui.getSticker("ui//plus"),
                    }}
                  ></div>
                </button>
              </div>
            </div>
            {libraries.get(f).map((g, k) => (
              <div
                key={k}
                onClick={() =>
                  props.superstate.ui.openPath(
                    `spaces://$actions/${f}/#;${g.schema.id}`
                  )
                }
              >
                {g.schema.name}
              </div>
            ))}
          </React.Fragment>
        ))}
        <button
          onClick={(e) => {
            props.superstate.ui.openModal(
              i18n.labels.newAction,

              <InputModal
                value=""
                saveLabel={i18n.buttons.save}
                saveValue={(value) => {
                  props.superstate.spaceManager.saveSystemCommand(value, null);
                }}
              ></InputModal>,
              windowFromDocument(e.view.document)
            );
          }}
        ></button>
      </div>
    </div>
  );
};
