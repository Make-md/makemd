import { Superstate, i18n } from "makemd-core";
import React, { useCallback, useEffect, useState } from "react";
import { SpaceProperty, SpaceTableSchema } from "shared/types/mdb";
import { VisualizationConfig } from "shared/types/visualization";
import { showSelectMenu } from "../UI/Menus/selectMenu";
import { showSpacesMenu } from "../UI/Menus/properties/selectSpaceMenu";
import { windowFromDocument } from "shared/utils/dom";


export interface VisualizationSetupProps {
  superstate?: Superstate;
  mdbFrameId?: string;
  fields: SpaceProperty[];
  availableSchemas: SpaceTableSchema[];
  sourcePath: string;
  currentSpace?: string;
  currentList?: string;
  currentXField?: string;
  currentYField?: string;
  onSaveSpace: (space: string) => void;
  onSaveList: (list: string) => void;
  onSaveXField: (field: string) => void;
  onSaveYField: (field: string) => void;
}


export const VisualizationSetup: React.FC<VisualizationSetupProps> = ({
  mdbFrameId,
  sourcePath,
  superstate,
  fields,
  availableSchemas,
  currentSpace,
  currentList,
  currentXField,
  currentYField,
  onSaveSpace,
  onSaveList,
  onSaveXField,
  onSaveYField
}) => {
  const [selectedSpace, setSelectedSpace] = useState<string>(currentSpace || sourcePath || "");
  const [selectedList, setSelectedList] = useState<string>(currentList || "");
  const [selectedXField, setSelectedXField] = useState<string>(currentXField || "");
  const [selectedYField, setSelectedYField] = useState<string>(currentYField || "");
  const [availableFields, setAvailableFields] = useState<SpaceProperty[]>(fields || []);

  // Update states when props change
  useEffect(() => {
    if (currentSpace !== undefined) setSelectedSpace(currentSpace);
  }, [currentSpace]);

  useEffect(() => {
    if (currentList !== undefined) setSelectedList(currentList);
  }, [currentList]);

  useEffect(() => {
    if (currentXField !== undefined) setSelectedXField(currentXField);
  }, [currentXField]);

  useEffect(() => {
    if (currentYField !== undefined) setSelectedYField(currentYField);
  }, [currentYField]);

  // Update available fields when fields prop changes
  useEffect(() => {
    setAvailableFields(fields || []);
  }, [fields]);

  // Handle space selection
  const handleSpaceSelect = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    
    showSpacesMenu(
      offset, 
      windowFromDocument((e.target as HTMLElement).ownerDocument),
      superstate,
      (path) => {
        setSelectedSpace(path);
        onSaveSpace(path);
        // Reset list and fields when space changes
        setSelectedList("");
        setSelectedXField("");
        setSelectedYField("");
      }
    );
  };

  // Handle list selection
  const handleListSelect = (e: React.MouseEvent) => {
    if (!availableSchemas || availableSchemas.length === 0) return;
    
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const lists = availableSchemas.map(list => ({
      name: list.name,
      value: list.id
    }));
    
    showSelectMenu(
      offset,
      {
        ui: superstate.ui,
        multi: false,
        editable: false,
        value: [selectedList],
        options: lists,
        saveOptions: (value) => {
          const newList = value[0];
          setSelectedList(newList);
          onSaveList(newList);
        }
      },
      windowFromDocument((e.target as HTMLElement).ownerDocument),
      "bottom"
    );
  };

  // Handle X field selection
  const handleXFieldSelect = (e: React.MouseEvent) => {
    if (!availableFields || availableFields.length === 0) return;
    
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const fieldOptions = availableFields.map(field => ({
      name: field.name,
      value: field.name
    }));
    
    showSelectMenu(
      offset,
      {
        ui: superstate.ui,
        multi: false,
        editable: false,
        value: [selectedXField],
        options: fieldOptions,
        saveOptions: (value) => {
          const newField = value[0];
          setSelectedXField(newField);
          onSaveXField(newField);
        }
      },
      windowFromDocument((e.target as HTMLElement).ownerDocument),
      "bottom"
    );
  };

  // Handle Y field selection
  const handleYFieldSelect = (e: React.MouseEvent) => {
    if (!availableFields || availableFields.length === 0) return;
    
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const fieldOptions = availableFields.map(field => ({
      name: field.name,
      value: field.name
    }));
    
    showSelectMenu(
      offset,
      {
        ui: superstate.ui,
        multi: false,
        editable: false,
        value: [selectedYField],
        options: fieldOptions,
        saveOptions: (value) => {
          const newField = value[0];
          setSelectedYField(newField);
          onSaveYField(newField);
        }
      },
      windowFromDocument((e.target as HTMLElement).ownerDocument),
      "bottom"
    );
  };

  if (!superstate) return null;

  return <div>
    <div className="mk-path-context-row">
      <div className="mk-path-context-field">
        <div
          className="mk-path-context-field-icon"
          dangerouslySetInnerHTML={{
            __html: superstate.ui.getSticker("ui//database"),
          }}
        ></div>
        <div className="mk-path-context-field-key">Space</div>
      </div>
      <div className="mk-path-context-value">
        <div 
          className="mk-cell-text" 
          onClick={handleSpaceSelect}
          style={{ cursor: "pointer" }}
        >
          {selectedSpace ? (superstate.pathsIndex.get(selectedSpace)?.name || selectedSpace) : "Select Space"}
        </div>
      </div>
    </div>
    
    <div className="mk-path-context-row">
      <div className="mk-path-context-field">
        <div
          className="mk-path-context-field-icon"
          dangerouslySetInnerHTML={{
            __html: superstate.ui.getSticker("ui//list"),
          }}
        ></div>
        <div className="mk-path-context-field-key">List</div>
      </div>
      <div className="mk-path-context-value">
        <div 
          className="mk-cell-text" 
          onClick={handleListSelect}
          style={{ 
            cursor: selectedSpace && availableSchemas && availableSchemas.length > 0 ? "pointer" : "not-allowed",
            opacity: selectedSpace && availableSchemas && availableSchemas.length > 0 ? 1 : 0.5
          }}
        >
          {selectedList ? availableSchemas?.find(l => l.id === selectedList)?.name || selectedList : "Select List"}
        </div>
      </div>
    </div>
    
    <div className="mk-path-context-row">
      <div className="mk-path-context-field">
        <div
          className="mk-path-context-field-icon"
          dangerouslySetInnerHTML={{
            __html: superstate.ui.getSticker("ui//arrow-right"),
          }}
        ></div>
        <div className="mk-path-context-field-key">X-Field</div>
      </div>
      <div className="mk-path-context-value">
        <div 
          className="mk-cell-text" 
          onClick={handleXFieldSelect}
          style={{ 
            cursor: availableFields.length > 0 ? "pointer" : "not-allowed",
            opacity: availableFields.length > 0 ? 1 : 0.5
          }}
        >
          {selectedXField || "Select X Field"}
        </div>
      </div>
    </div>
    
    <div className="mk-path-context-row">
      <div className="mk-path-context-field">
        <div
          className="mk-path-context-field-icon"
          dangerouslySetInnerHTML={{
            __html: superstate.ui.getSticker("ui//arrow-up"),
          }}
        ></div>
        <div className="mk-path-context-field-key">Y-Field</div>
      </div>
      <div className="mk-path-context-value">
        <div 
          className="mk-cell-text" 
          onClick={handleYFieldSelect}
          style={{ 
            cursor: availableFields.length > 0 ? "pointer" : "not-allowed",
            opacity: availableFields.length > 0 ? 1 : 0.5
          }}
        >
          {selectedYField || "Select Y Field"}
        </div>
      </div>
    </div>
  </div>
};