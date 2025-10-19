import React, { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  DragEndEvent,
  MeasuringStrategy,
  PointerSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SelectOption, Superstate } from "makemd-core";
import i18n from "shared/i18n";
import { getColors, getColorPalettes, getColorPaletteById, getThemeColors } from "core/utils/colorPalette";
import { defaultMenu, menuInput, menuSeparator } from "core/react/components/UI/Menus/menu/SelectionMenu";
import { showColorPickerMenu } from "core/react/components/UI/Menus/properties/colorPickerMenu";
import { uniq } from "shared/utils/array";
import { parseMultiString } from "utils/parsers";
import { windowFromDocument } from "shared/utils/dom";

interface EditOptionsModalProps {
  superstate: Superstate;
  options: SelectOption[];
  saveOptions: (options: SelectOption[], colorScheme?: string) => void;
  colorScheme?: string;
  contextPath?: string;
  propertyName?: string;
  hide?: () => void;
}

interface SortableOptionItemProps {
  id: string;
  option: SelectOption;
  onRemove: () => void;
  onEdit: (newValue: SelectOption) => void;
  superstate: Superstate;
  colorScheme?: string;
}

const SortableOptionItem: React.FC<SortableOptionItemProps> = ({
  id,
  option,
  onRemove,
  onEdit,
  superstate,
  colorScheme,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(option.value);

  const handleColorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Always show color picker menu regardless of color scheme
    showColorPickerMenu(
      superstate,
      (e.target as HTMLElement).getBoundingClientRect(),
      windowFromDocument(e.view.document),
      option.color || "var(--mk-color-none)",
      (color: string) => {
        onEdit({ ...option, color });
      }
    );
  };

  const handleEditSubmit = () => {
    if (editValue.trim()) {
      onEdit({ ...option, value: editValue.trim(), name: editValue.trim() });
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mk-option-item"
      {...attributes}
    >
      <div className="mk-option-item-content">
        <div
          className="mk-option-drag-handle"
          {...listeners}
        >
          <span
            dangerouslySetInnerHTML={{
              __html: superstate.ui.getSticker("ui//mk-ui-handle") || "⋮⋮",
            }}
          />
        </div>
        
        <div
          className="mk-option-color"
          onClick={handleColorClick}
          style={{
            backgroundColor: option.color || "var(--mk-color-none)",
            width: "16px",
            height: "16px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        />

        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleEditSubmit();
              } else if (e.key === "Escape") {
                setEditValue(option.value);
                setIsEditing(false);
              }
            }}
            autoFocus
            className="mk-input"
            style={{ flex: 1 }}
          />
        ) : (
          <div
            className="mk-option-label"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            style={{ flex: 1, cursor: "text" }}
          >
            {option.value}
          </div>
        )}

        <button
          className="mk-option-remove mk-toolbar-button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={i18n.labels.removeOption}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export const EditOptionsModal: React.FC<EditOptionsModalProps> = ({
  superstate,
  options: initialOptions,
  saveOptions,
  colorScheme: initialColorScheme,
  contextPath,
  propertyName,
  hide,
}) => {
  const [colorScheme, setColorScheme] = useState(initialColorScheme || "");
  
  // Apply color scheme colors to initial options if they don't have colors
  const applyColorSchemeToOptions = (opts: SelectOption[], scheme: string) => {
    // If no scheme is selected, return options as-is
    if (!scheme) {
      return opts;
    }
    
    const palette = getColorPaletteById(superstate, scheme);
    const colors = palette ? palette.colors : getThemeColors(superstate);
    
    return opts.map((opt, index) => {
      // If option already has a color that's not the default, keep it
      if (opt.color && opt.color !== "var(--mk-color-none)") {
        return opt;
      }
      // Otherwise assign a color from the palette based on index
      const colorIndex = index % colors.length;
      const color = colors[colorIndex]?.value || "var(--mk-color-none)";
      return { ...opt, color };
    });
  };
  
  const [options, setOptions] = useState<SelectOption[]>(
    applyColorSchemeToOptions(
      initialOptions.map((opt, index) => ({
        ...opt,
        id: opt.value || `option-${index}`,
        color: opt.color || "var(--mk-color-none)",
      })),
      colorScheme
    )
  );
  const [newOptionValue, setNewOptionValue] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      setOptions((items) => {
        const oldIndex = items.findIndex((opt) => opt.value === active.id);
        const newIndex = items.findIndex((opt) => opt.value === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOptions = arrayMove(items, oldIndex, newIndex);
          // Auto-save on reorder
          saveOptions(newOptions, colorScheme);
          return newOptions;
        }
        return items;
      });
    }
  };

  const handleAddOption = () => {
    if (newOptionValue.trim()) {
      let color = "var(--mk-color-none)";
      
      // Only apply color from palette if a scheme is selected
      if (colorScheme) {
        const palette = getColorPaletteById(superstate, colorScheme);
        const colors = palette ? palette.colors : getThemeColors(superstate);
        const colorIndex = options.length % colors.length;
        color = colors[colorIndex]?.value || "var(--mk-color-none)";
      }
      
      const newOption: SelectOption = {
        name: newOptionValue.trim(),
        value: newOptionValue.trim(),
        color: color,
      };
      const newOptions = [...options, newOption];
      setOptions(newOptions);
      setNewOptionValue("");
      // Auto-save when adding new option
      saveOptions(newOptions, colorScheme);
    }
  };

  const handleRemoveOption = (optionValue: string) => {
    const newOptions = options.filter((opt) => opt.value !== optionValue);
    setOptions(newOptions);
    // Auto-save when removing option
    saveOptions(newOptions, colorScheme);
  };

  const handleEditOption = (optionValue: string, newOption: SelectOption) => {
    const newOptions = options.map((opt) => (opt.value === optionValue ? newOption : opt));
    setOptions(newOptions);
    // Auto-save when editing option
    saveOptions(newOptions, colorScheme);
  };


  const getExistingValues = () => {
    if (!contextPath || !propertyName) return [];
    
    const allValues = uniq(
      [...(superstate.spacesMap.getInverse(contextPath) ?? [])].flatMap(
        (f) =>
          parseMultiString(
            superstate.pathsIndex.get(f)?.metadata?.property?.[propertyName]
          ) ?? []
      )
    );
    
    // Filter out values that are already in options
    const existingOptionValues = options.map(opt => opt.value);
    return allValues.filter(val => !existingOptionValues.includes(val));
  };

  const handleAddExistingOptions = () => {
    const existingValues = getExistingValues();
    if (existingValues.length === 0) {
      superstate.ui.notify(i18n.notice.noExistingValues || "No existing values found");
      return;
    }
    
    const newOptions: SelectOption[] = existingValues.map((val, index) => {
      let color = "var(--mk-color-none)";
      
      // Only apply color from palette if a scheme is selected
      if (colorScheme) {
        const palette = getColorPaletteById(superstate, colorScheme);
        const colors = palette ? palette.colors : getThemeColors(superstate);
        const colorIndex = (options.length + index) % colors.length;
        color = colors[colorIndex]?.value || "var(--mk-color-none)";
      }
      
      return {
        name: val,
        value: val,
        color: color,
      };
    });
    
    const updatedOptions = [...options, ...newOptions];
    setOptions(updatedOptions);
    superstate.ui.notify(`Added ${existingValues.length} existing values`);
    // Auto-save when adding existing values
    saveOptions(updatedOptions, colorScheme);
  };

  const colorPalettes = getColorPalettes(superstate);
  
  return (
    <div className="mk-options-modal" style={{ display: "flex", flexDirection: "column", height: "100%", gap: "8px" }}>
      
      <div className="mk-option-add" style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={newOptionValue}
          onChange={(e) => setNewOptionValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAddOption();
            }
          }}
          placeholder="+ Option"
          className="mk-input mk-input-large"
          style={{ flex: 1 }}
        />
        {contextPath && propertyName && (
          <button 
            onClick={handleAddExistingOptions}
            className="mk-button mk-add-existing-button"
          >
            {i18n.buttons.addFromExisting || "Add Existing Values"}
          </button>
        )}
      </div>
      
      <div className="mk-options-list" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always,
            },
          }}
        >
          <SortableContext
            items={options.map(opt => opt.value)}
            strategy={verticalListSortingStrategy}
          >
            {options.map((option) => (
              <SortableOptionItem
                key={option.value}
                id={option.value}
                option={option}
                onRemove={() => handleRemoveOption(option.value)}
                onEdit={(newOption) => handleEditOption(option.value, newOption)}
                superstate={superstate}
                colorScheme={colorScheme}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <div className="mk-color-scheme-selector" style={{ borderTop: "1px solid var(--divider-color)", paddingTop: "8px" }}>
        <label>{i18n.labels.colorScheme || "Color Scheme"}</label>
        <button
          className="mk-select"
          onClick={(e) => {
            const menuOptions = [
              {
                name: i18n.menu.none || "None",
                value: "",
                onClick: () => {
                  setColorScheme("");
                  // If "None" is selected, keep existing colors
                  saveOptions(options, "");
                }
              },
              ...colorPalettes.map((palette) => ({
                name: palette.name,
                value: palette.id,
                onClick: () => {
                  const newColorScheme = palette.id;
                  setColorScheme(newColorScheme);
                  
                  // Re-apply colors to all options based on the new scheme
                  const colors = palette.colors;
                  
                  const updatedOptions = options.map((opt, index) => {
                    const colorIndex = index % colors.length;
                    const color = colors[colorIndex]?.value || "var(--mk-color-none)";
                    return { ...opt, color };
                  });
                  
                  setOptions(updatedOptions);
                  // Auto-save when color scheme changes
                  saveOptions(updatedOptions, newColorScheme);
                }
              }))
            ];
            
            superstate.ui.openMenu(
              (e.target as HTMLElement).getBoundingClientRect(),
              defaultMenu(superstate.ui, menuOptions),
              windowFromDocument(e.view.document)
            );
          }}
        >
          {colorScheme ? colorPalettes.find(p => p.id === colorScheme)?.name || colorScheme : (i18n.menu.none || "None")}
        </button>
      </div>

    </div>
  );
};