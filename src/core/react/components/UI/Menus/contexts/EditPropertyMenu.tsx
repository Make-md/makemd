import { DataPropertyView } from "core/react/components/SpaceView/Contexts/DataTypeView/DataPropertyView";
import { CellEditMode } from "core/react/components/SpaceView/Contexts/TableView/TableView";
import { updateTableRow } from "core/utils/contexts/context";
import { Superstate, i18n } from "makemd-core";
import React, { useEffect } from "react";
import { SpaceTable } from "shared/types/mdb";
import { PathState } from "shared/types/PathState";

export const EditPropertiesSubmenu = (props: {
  superstate: Superstate;
  pathState: PathState;
  path: string;
  schema: string;
  index: number;
  hide?: () => void;
}) => {
  const [context, setContext] = React.useState<SpaceTable>();
  useEffect(() => {
    const loadContext = async () => {
      const context = await props.superstate.spaceManager.readTable(
        props.path,
        props.schema
      );
      setContext(context);
    };
    loadContext();
  }, [props.path, props.schema]);
  const fields = context?.cols ?? [];
  const values = context?.rows[props.index];
  const savePropValue = async (name: string, value: string) => {
    const context = await props.superstate.spaceManager.readTable(
      props.path,
      props.schema
    );
    const row = context.rows[props.index];
    if (row) {
      updateTableRow(
        props.superstate.spaceManager,
        props.superstate.spacesIndex.get(props.path)?.space,
        props.schema,
        props.index,
        {
          ...row,
          [name]: value,
        }
      );
    }
  };
  return (
    <div className="mk-editor-frame-properties">
      <div className="mk-editor-actions-name">
        <div className="mk-editor-actions-name-icon">
          <div
            className="mk-icon-small"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//list"),
            }}
          ></div>
        </div>
        <div className="mk-editor-actions-name-text">
          {i18n.buttons.editProperty}
        </div>
        <span></span>
        <div
          className="mk-icon-small mk-inline-button"
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//close"),
          }}
          onClick={() => props.hide()}
        ></div>
      </div>
      <div className="mk-props-contexts">
        {fields.map((f, i) => {
          return (
            <React.Fragment key={i}>
              <DataPropertyView
                initialValue={values[f.name]}
                column={f}
                compactMode={false}
                superstate={props.superstate}
                editMode={CellEditMode.EditModeValueOnly}
                row={values}
                updateValue={(value: string) => {
                  savePropValue(f.name, value);
                }}
                source={props.pathState.path}
                columns={fields}
              ></DataPropertyView>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
