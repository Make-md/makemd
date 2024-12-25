import { EditorView } from "@codemirror/view";
import i18n from "core/i18n";
import { showNewPropertyMenu } from "core/react/components/UI/Menus/contexts/newSpacePropertyMenu";
import { showSpacesMenu } from "core/react/components/UI/Menus/properties/selectSpaceMenu";
import ImageModal from "core/react/components/UI/Modals/ImageModal";
import { FramesMDBContext } from "core/react/context/FramesMDBContext";
import { PathContext } from "core/react/context/PathContext";
import { Superstate } from "core/superstate/superstate";
import { savePathBanner } from "core/superstate/utils/label";
import { createSpace, saveProperties } from "core/superstate/utils/spaces";
import { addTagToPath } from "core/superstate/utils/tags";
import { isTouchScreen } from "core/utils/ui/screen";
import React, { useContext, useLayoutEffect, useMemo } from "react";
import { defaultContextSchemaID, mainFrameID } from "schemas/mdb";
import { SpaceProperty } from "types/mdb";
import { windowFromDocument } from "utils/dom";
import { defaultValueForType } from "utils/properties";
import { HeaderPropertiesView } from "../SpaceView/Contexts/SpaceEditor/HeaderPropertiesView";
import { TitleComponent } from "../SpaceView/TitleComponent";
import { showSpaceContextMenu } from "../UI/Menus/navigator/spaceContextMenu";
import { BannerView } from "./BannerView";

export const MarkdownHeaderView = (props: {
  superstate: Superstate;
  hiddenFields?: string[];
  editable: boolean;
  editorView?: EditorView;
}) => {
  const { pathState } = useContext(PathContext);

  useLayoutEffect(() => {
    props.editorView?.requestMeasure();
  }, []);
  const [repositionMode, setRepositionMode] = React.useState(false);
  return (
    pathState && (
      <>
        <div className="mk-path-context-component">
          <div
            className={`mk-path-context-label ${
              props.superstate.settings.inlineContextNameLayout == "horizontal"
                ? "mk-path-context-file-horizontal"
                : ""
            }`}
          >
            {props.superstate.settings.banners && (
              <BannerView
                superstate={props.superstate}
                reposition={repositionMode}
                setReposition={setRepositionMode}
              ></BannerView>
            )}
            <TitleComponent
              superstate={props.superstate}
              readOnly={!props.editable}
              setReposition={setRepositionMode}
            ></TitleComponent>
          </div>
          {props.editable &&
            props.superstate.settings.inlineContextProperties && (
              <HeaderPropertiesView
                superstate={props.superstate}
                collapseSpaces={true}
              ></HeaderPropertiesView>
            )}
        </div>
      </>
    )
  );
};

export const NoteActionBar = (props: { superstate: Superstate }) => {
  const { pathState, addToSpace } = useContext(PathContext);

  const spaces = useMemo(
    () =>
      pathState
        ? [...props.superstate.spacesMap.get(pathState.path)]
            .map((f) => props.superstate.spacesIndex.get(f))
            .filter((f) => f)
            .map((f) => f.path)
        : [],
    [pathState]
  );

  const { newProperty: newPropertyInFrame } = useContext(FramesMDBContext);
  const saveField = (source: string, field: SpaceProperty) => {
    if (source == "$fm") {
      saveProperties(props.superstate, pathState.path, {
        [field.name]: defaultValueForType(field.type),
      });
      if (newPropertyInFrame) {
        newPropertyInFrame({ ...field, schemaId: mainFrameID });
      }

      return true;
    }
    props.superstate.spaceManager.addSpaceProperty(source, field);
    return true;
  };
  const showContextMenu = (e: React.MouseEvent) => {
    showSpaceContextMenu(props.superstate, pathState, e, null, null);
  };
  const newProperty = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    showNewPropertyMenu(
      props.superstate,
      offset,
      windowFromDocument(e.view.document),
      {
        spaces,
        fields: [],
        saveField,
        schemaId: defaultContextSchemaID,
        fileMetadata: true,
        isSpace: newPropertyInFrame ? true : false,
      }
    );
  };

  const changeCover = (e: React.MouseEvent) => {
    props.superstate.ui.openPalette(
      <ImageModal
        superstate={props.superstate}
        selectedPath={(image) => {
          savePathBanner(props.superstate, pathState.path, image);
        }}
      />,
      windowFromDocument(e.view.document)
    );
  };

  const showAddMenu = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
    showSpacesMenu(
      offset,
      windowFromDocument(e.view.document),
      props.superstate,
      (link: string, isNew: boolean) => {
        if (isNew) {
          if (link.charAt(0) == "#") {
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

  return (
    <div>
      <button onClick={(e) => newProperty(e)} className="mk-inline-button">
        <div
          className="mk-icon-xsmall"
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//plus"),
          }}
        ></div>
        {isTouchScreen(props.superstate.ui)
          ? i18n.labels.newPropertyShort
          : i18n.labels.newProperty}
      </button>

      <button onClick={(e) => showAddMenu(e)}>
        <div
          className="mk-icon-xsmall"
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//pin"),
          }}
        ></div>
        {isTouchScreen(props.superstate.ui)
          ? i18n.buttons.addToSpaceShort
          : i18n.buttons.addToSpace}
      </button>
      {pathState && (
        <button onClick={(e) => changeCover(e)}>
          <div
            className="mk-icon-xsmall"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//mk-make-image"),
            }}
          ></div>
          {isTouchScreen(props.superstate.ui)
            ? i18n.buttons.changeBannerShort
            : i18n.buttons.changeBanner}
        </button>
      )}
      {pathState?.type == "space" && (
        <button
          aria-label={i18n.buttons.moreOptions}
          className="mk-icon-xsmall mk-inline-button"
          onClick={(e) => {
            showContextMenu(e);
          }}
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//options"),
          }}
        ></button>
      )}
    </div>
  );
};
