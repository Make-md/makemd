import * as acorn from "acorn";
import { InlineMenuComponent } from "adapters/obsidian/ui/editors/markdownView/menus/inlineStylerView/InlineMenu";
import ImageModal from "core/react/components/UI/Modals/ImageModal";
import StickerModal from "core/react/components/UI/Modals/StickerModal";
import {
  savePathBanner,
  savePathSticker,
  updatePrimaryAlias,
} from "core/superstate/utils/label";
import { deletePath } from "core/superstate/utils/path";
import {
  newPathInSpace,
  pinPathToSpaceAtIndex,
  removeSpace,
  saveSpaceMetadataValue,
} from "core/superstate/utils/spaces";
import { PathState, SpaceState } from "core/types/superstate";

import { movePath } from "core/utils/uri";
import MakeMDPlugin from "main";
import React, { PropsWithChildren, useEffect, useState } from "react";

export const openTestModal = (plugin: MakeMDPlugin) => {
  const superstate = plugin.superstate;
  superstate.ui.openModal(
    "Tests",
    (props) => <TestComponent plugin={plugin}></TestComponent>,
    window
  );
};
export const TestInputComponent = (
  props: PropsWithChildren<{
    action: (value: string) => void;
  }>
) => {
  const [value, setValue] = useState<string>("");
  return (
    <div>
      <input onChange={(e) => setValue(e.target.value)}></input>
      <button onClick={() => props.action(value)}>{props.children}</button>
    </div>
  );
};

export const TestActionComponent = (
  props: PropsWithChildren<{
    action: () => void;
  }>
) => {
  return (
    <div>
      <button onClick={() => props.action()}>{props.children}</button>
    </div>
  );
};

export const TestToggleSection = (
  props: PropsWithChildren<{ section: string }>
) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <h2 onClick={() => setExpanded((f) => !f)}>{props.section}</h2>
      {expanded && <div>{props.children}</div>}
    </div>
  );
};
export const TestComponent = (props: { plugin: MakeMDPlugin }) => {
  const superstate = props.plugin.superstate;
  const [space, setSpace] = useState<SpaceState>(null);
  const [path, setPath] = useState<PathState>(null);
  const [sticker, setSticker] = useState<string>(null);
  const [image, setImage] = useState<string>(null);
  const [output, setOutput] = useState<string>("");
  useEffect(() => {
    superstate.eventsDispatcher.addListener(
      "spaceStateUpdated",
      (payload: { path: string }) => {
        if (payload.path == space?.path) {
          setSpace(superstate.spacesIndex.get(payload.path));
        }
      }
    );
    superstate.eventsDispatcher.addListener(
      "pathStateUpdated",
      (payload: { path: string }) => {
        if (payload.path == path?.path) {
          setPath(superstate.pathsIndex.get(payload.path));
        }
      }
    );
  }, []);
  return (
    <div className="mk-layout-row" style={{ fontSize: "10px" }}>
      <div>
        <InlineMenuComponent
          plugin={props.plugin}
          cm={null}
          activeMarks={[]}
          mobile={false}
        />
        <TestInputComponent
          action={(value) =>
            setOutput(
              JSON.stringify(superstate.spaceManager.uriByString(value))
            )
          }
        >
          URI
        </TestInputComponent>
        <TestToggleSection section={"Space"}>
          <TestInputComponent
            action={(value) => setSpace(superstate.spacesIndex.get(value))}
          >
            Select Space
          </TestInputComponent>
          <p>
            {space?.path ?? "No Selected Space"}
            <button
              onClick={() => setSpace(superstate.spacesIndex.get(space.path))}
            >
              Refresh
            </button>
            <button
              onClick={() => setPath(superstate.pathsIndex.get(space.path))}
            >
              Set Path
            </button>
          </p>
          {space && (
            <div>
              Contexts {space.contexts?.map((f) => f)}
              {superstate.getSpaceItems(space.path).map((f, i) => (
                <div key={i}>
                  {f.path}{" "}
                  <button
                    onClick={() => setSpace(superstate.spacesIndex.get(f.path))}
                  >
                    Set Space
                  </button>
                  <button
                    onClick={() => setPath(superstate.pathsIndex.get(f.path))}
                  >
                    Set Path
                  </button>
                  <button onClick={() => navigator.clipboard.writeText(f.path)}>
                    Copy
                  </button>
                </div>
              ))}
            </div>
          )}
        </TestToggleSection>
        <TestToggleSection section={"Path"}>
          <TestInputComponent
            action={(value) => setPath(superstate.pathsIndex.get(value))}
          >
            Select Path
          </TestInputComponent>
          <p>{path?.path ?? "No Selected Path"}</p>
          {path && (
            <div>
              Sticker
              <div
                dangerouslySetInnerHTML={{
                  __html: superstate.ui.getSticker(path?.label.sticker),
                }}
                style={{ height: "50px", width: "50px" }}
              />
              Banner
              <img
                src={superstate.ui.getUIPath(path?.metadata.banner)}
                style={{ height: "50px", width: "50px" }}
              ></img>
            </div>
          )}
        </TestToggleSection>
        <h2>Sticker</h2>
        <div
          dangerouslySetInnerHTML={{
            __html: superstate.ui.getSticker(sticker),
          }}
          style={{ height: "50px", width: "50px" }}
        />
        <h2>Image</h2>
        <img
          src={superstate.ui.getUIPath(image)}
          style={{ height: "50px", width: "50px" }}
        ></img>
        <h2>Output</h2>
        <div>{output}</div>
      </div>
      <div>
        <TestInputComponent
          action={(value) => {
            try {
              acorn.parse(value, {
                ecmaVersion: 2020,
                locations: true,
              });
            } catch (e) {
              setOutput(e);
            }
          }}
        >
          Acorn
        </TestInputComponent>
        <TestToggleSection section={"Space"}>
          <TestInputComponent
            action={(value) =>
              superstate.spaceManager.createSpace(value, space.path, {})
            }
          >
            Create Space
          </TestInputComponent>
          <TestInputComponent
            action={(value) =>
              superstate.spaceManager.renameSpace(space.path, value)
            }
          >
            Rename Space
          </TestInputComponent>
          <TestInputComponent
            action={(value) => removeSpace(superstate, value)}
          >
            Delete Space
          </TestInputComponent>
          <TestInputComponent
            action={(value) =>
              saveSpaceMetadataValue(superstate, space.path, "contexts", [
                value,
              ])
            }
          >
            Set Space Context
          </TestInputComponent>
          <TestInputComponent
            action={(value) => removeSpace(superstate, value)}
          >
            Remove Space Context
          </TestInputComponent>
          <TestActionComponent
            action={() => savePathBanner(superstate, space.path, image)}
          >
            Set Space Banner
          </TestActionComponent>
          <TestInputComponent
            action={(value) =>
              updatePrimaryAlias(superstate, space.path, [], value)
            }
          >
            Set Space Alias
          </TestInputComponent>
          <TestActionComponent
            action={() => savePathSticker(superstate, space.path, sticker)}
          >
            Set Space Sticker
          </TestActionComponent>
        </TestToggleSection>
        <TestToggleSection section={"Path"}>
          <TestInputComponent
            action={(value) => newPathInSpace(superstate, space, "md", value)}
          >
            Create Path
          </TestInputComponent>
          <TestInputComponent
            action={(value) =>
              superstate.spaceManager.copyPath(path.path, value)
            }
          >
            Copy Path
          </TestInputComponent>
          <TestInputComponent
            action={(value) =>
              superstate.spaceManager.renamePath(
                path.path,
                movePath(path.path, value)
              )
            }
          >
            Move Path
          </TestInputComponent>
          <TestInputComponent action={(value) => deletePath(superstate, value)}>
            Delete Path
          </TestInputComponent>
          <TestInputComponent
            action={(value) => pinPathToSpaceAtIndex(superstate, space, value)}
          >
            Pin Path
          </TestInputComponent>
        </TestToggleSection>
        <TestToggleSection section={"Modals"}>
          <button
            onClick={() =>
              superstate.ui.openPalette(
                (props: { hide: () => void }) => (
                  <ImageModal
                    hide={props.hide}
                    superstate={superstate}
                    selectedPath={(value) => setImage(value)}
                  />
                ),
                window
              )
            }
          >
            Set Image
          </button>
          <button
            onClick={() =>
              superstate.ui.openPalette(
                (props: { hide: () => void }) => (
                  <StickerModal
                    hide={props.hide}
                    ui={superstate.ui}
                    selectedSticker={(value) => setSticker(value)}
                  />
                ),
                window
              )
            }
          >
            Set Sticker
          </button>
        </TestToggleSection>
        <div>
          <h2>Menus</h2>
        </div>
        <div>
          <h2>Modals</h2>
        </div>
      </div>
    </div>
  );
};
