import { showColorPickerMenu } from "core/react/components/UI/Menus/properties/colorPickerMenu";
import { InputModal } from "core/react/components/UI/Modals/InputModal";
import { Superstate, i18n } from "makemd-core";
import React, { useState } from "react";
import {
  ColorPaletteAsset,
  NamedColor,
  NamedGradient,
} from "shared/types/assets";
import { SettingsProps } from "./types";

const ColorPaletteManager = ({ superstate }: { superstate: Superstate }) => {
  const [palettes, setPalettes] = useState<ColorPaletteAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPaletteName, setNewPaletteName] = useState("");
  const [showImportArea, setShowImportArea] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");

  React.useEffect(() => {
    loadPalettes();
  }, [superstate]);

  const resetDefaultPalettes = async () => {
    try {
      await loadPalettes();
    } catch (e) {
      console.error("Failed to reset default palettes:", e);
    }
  };

  const createNewPalette = async () => {
    if (!newPaletteName.trim()) return;

    const assetManager = superstate.assets;
    if (assetManager) {
      const newPalette = {
        id: `palette-${Date.now()}`,
        name: newPaletteName.trim(),
        path: `assets/color-palettes/${newPaletteName.trim()}`,
        type: "colorpalette" as const,
        colors: [
          { name: "Color 1", value: "#3b82f6", category: "custom" as const },
        ],
        gradients: [] as NamedGradient[],
        designSystemMapping: { baseTokens: {}, semanticTokens: {} },
        tags: [] as string[],
        category: "custom" as const,
        description: "",
        created: Date.now(),
        modified: Date.now(),
      };

      await savePalette(newPalette);
      setNewPaletteName("");
      await loadPalettes();
    }
  };

  const handleNewPaletteKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      createNewPalette();
    }
  };

  const loadPalettes = async () => {
    try {
      setLoading(true);

      // Use the asset manager to get color palettes
      const assetManager = superstate.assets;
      if (assetManager) {
        const colorPalettes = assetManager.getColorPalettes();

        // Ensure we have an array
        if (Array.isArray(colorPalettes)) {
          // Sort palettes to ensure default ones appear first in correct order
          const sortedPalettes = [...colorPalettes].sort((a, b) => {
            // Define the order for default palettes
            const defaultOrder = ["Default", "Monochrome", "Gradients"];
            const aIndex = defaultOrder.indexOf(a.name);
            const bIndex = defaultOrder.indexOf(b.name);

            // If both are default palettes, sort by their defined order
            if (aIndex !== -1 && bIndex !== -1) {
              return aIndex - bIndex;
            }

            // Default palettes come first
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;

            // Sort custom palettes alphabetically
            return a.name.localeCompare(b.name);
          });

          setPalettes(sortedPalettes);
        } else {
          console.error(
            "[ColorPaletteManager] getColorPalettes() did not return an array:",
            colorPalettes
          );
          setPalettes([]);
        }
      } else {
        console.error("[ColorPaletteManager] Asset manager not available");
        setPalettes([]);
      }
    } catch (e) {
      console.error("Failed to load palettes:", e);
      setPalettes([]);
    } finally {
      setLoading(false);
    }
  };

  const savePalette = async (palette: ColorPaletteAsset) => {
    try {
      const assetManager = superstate.assets;
      if (assetManager) {
        const success = await assetManager.saveColorPalette(palette);
        if (success) {
          // Reload palettes to get updated data
          await loadPalettes();
        } else {
          console.error("Failed to save palette");
        }
      }
    } catch (e) {
      console.error("Failed to save color palette:", e);
    }
  };

  const deletePalette = async (paletteId: string) => {
    try {
      const assetManager = superstate.assets;
      if (assetManager) {
        const success = await assetManager.deleteColorPalette(paletteId);
        if (success) {
          // Reload palettes to get updated data
          await loadPalettes();
        } else {
          console.error("Failed to delete palette");
        }
      }
    } catch (e) {
      console.error("Failed to delete color palette:", e);
    }
  };

  const exportPalette = async (palette: ColorPaletteAsset) => {
    const exportData = {
      name: palette.name,
      colors: palette.colors,
      gradients: palette.gradients || [],
      designSystemMapping: palette.designSystemMapping,
      tags: palette.tags,
      category: palette.category,
      description: palette.description || "",
    };

    const dataStr = JSON.stringify(exportData, null, 2);

    try {
      await navigator.clipboard.writeText(dataStr);
      superstate.ui.notify(`Palette "${palette.name}" copied to clipboard`);
    } catch (e) {
      console.error("Failed to copy to clipboard:", e);
      superstate.ui.notify("Failed to copy palette to clipboard", "error");
    }
  };

  const importPaletteFromText = async () => {
    if (!importText.trim()) return;

    try {
      setImportError("");
      const importedData = JSON.parse(importText);

      // Validate the imported data
      if (!importedData.name || !Array.isArray(importedData.colors)) {
        setImportError(
          "Invalid palette file format. Must have 'name' and 'colors' array."
        );
        return;
      }

      const newPalette: ColorPaletteAsset = {
        id: `palette-${Date.now()}`,
        name: importedData.name,
        path: `assets/color-palettes/${importedData.name
          .replace(/\s+/g, "-")
          .toLowerCase()}`,
        type: "colorpalette" as const,
        colors: importedData.colors.map((color: any) => ({
          name: color.name || "Unnamed Color",
          value: color.value || "#000000",
          category: color.category || "custom",
          cssVariable: color.cssVariable,
          semanticTokens: color.semanticTokens || [],
          description: color.description,
          aliases: color.aliases || [],
        })),
        gradients: importedData.gradients || [],
        designSystemMapping: importedData.designSystemMapping || {
          baseTokens: {},
          semanticTokens: {},
        },
        tags: importedData.tags || [],
        category: importedData.category || ("custom" as const),
        description: importedData.description || "",
        created: Date.now(),
        modified: Date.now(),
      };

      await savePalette(newPalette);
      await loadPalettes();

      // Reset and close area
      setImportText("");
      setShowImportArea(false);
      setImportError("");
    } catch (e) {
      setImportError("Invalid JSON format");
    }
  };

  const addNewPalette = async () => {
    superstate.ui.openPalette(
      <InputModal
        value=""
        saveValue={async (name: string) => {
          if (!name) return;

          const newPalette = {
            id: `palette-${Date.now()}`,
            name: name,
            path: `assets/color-palettes/palette-${Date.now()}`,
            type: "colorpalette" as const,
            colors: [] as NamedColor[],
            gradients: [] as NamedGradient[],
            designSystemMapping: { baseTokens: {}, semanticTokens: {} },
            tags: ["custom"],
            category: "custom" as const,
            description: "",
            created: Date.now(),
            modified: Date.now(),
          };

          await savePalette(newPalette);
        }}
        saveLabel={i18n.buttons.create}
      />,
      window,
      "mk-modal-input"
    );
  };

  if (loading) {
    return (
      <div className="mk-color-palette-manager">
        {i18n.labels.loadingPalettes}
      </div>
    );
  }

  return (
    <div className="mk-color-palette-manager">
      {palettes.map((palette) => (
        <div key={palette.id} className="mk-palette-item">
          <div className="mk-palette-left-column">
            <div
              className="mk-palette-header"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <div className="mk-palette-name">{palette.name}</div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                {![
                  "Default",
                  "Default Colors",
                  "Monochrome",
                  "Monochrome Colors",
                  "Gradients",
                ].includes(palette.name) && (
                  <button
                    className="mk-inline-button"
                    onClick={() => deletePalette(palette.id)}
                    title={i18n.settings.tooltips.deletePalette}
                  >
                    <div
                      className="mk-icon-small"
                      dangerouslySetInnerHTML={{
                        __html: superstate.ui.getSticker("ui//trash"),
                      }}
                    />
                  </button>
                )}
                {[
                  "Default",
                  "Default Colors",
                  "Monochrome",
                  "Monochrome Colors",
                  "Gradients",
                ].includes(palette.name) && (
                  <button
                    className="mk-inline-button"
                    onClick={() => {
                      // Reset individual palette to default
                      loadPalettes();
                    }}
                    title={i18n.settings.tooltips.resetToDefault}
                  >
                    <div
                      className="mk-icon-small"
                      dangerouslySetInnerHTML={{
                        __html: superstate.ui.getSticker("ui//refresh"),
                      }}
                    />
                  </button>
                )}
                <button
                  className="mk-inline-button"
                  onClick={() => exportPalette(palette)}
                  title={
                    i18n.settings.tooltips.exportPalette ||
                    "Copy palette to clipboard"
                  }
                >
                  <div
                    className="mk-icon-small"
                    dangerouslySetInnerHTML={{
                      __html: superstate.ui.getSticker("ui//copy"),
                    }}
                  />
                </button>
              </div>
            </div>
          </div>
          <div className="mk-palette-right-column">
            <div className="mk-palette-colors">
              {palette.colors.map((color: any, index: number) => (
                <div key={index} className="mk-color-wrapper">
                  <div
                    className="mk-color"
                    style={{ background: color.value }}
                    title={`${color.name}: ${color.value}`}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      showColorPickerMenu(
                        superstate,
                        {
                          x: rect.left,
                          y: rect.bottom,
                          width: rect.width,
                          height: rect.height,
                        },
                        window,
                        color.value,
                        (newColor) => {
                          const updatedPalette = { ...palette };
                          updatedPalette.colors[index].value = newColor;
                          updatedPalette.modified = Date.now();
                          savePalette(updatedPalette);
                        },
                        false, // stayOpen
                        false, // isSubmenu
                        true // hidePaletteSelector
                      );
                    }}
                  />
                  {palette.colors.length > 1 && (
                    <button
                      className="mk-color-remove"
                      onClick={() => {
                        const updatedPalette = { ...palette };
                        updatedPalette.colors.splice(index, 1);
                        updatedPalette.modified = Date.now();
                        savePalette(updatedPalette);
                      }}
                      title={i18n.settings.tooltips.removeColor}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                className="mk-color mk-palette-add-color"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  showColorPickerMenu(
                    superstate,
                    {
                      x: rect.left,
                      y: rect.bottom,
                      width: rect.width,
                      height: rect.height,
                    },
                    window,
                    "#3b82f6", // Default blue color
                    (selectedColor) => {
                      const updatedPalette = { ...palette };
                      updatedPalette.colors.push({
                        name: `Color ${updatedPalette.colors.length + 1}`,
                        value: selectedColor,
                        category: "custom",
                      });
                      updatedPalette.modified = Date.now();
                      savePalette(updatedPalette);
                    },
                    false, // stayOpen
                    false, // isSubmenu
                    true // hidePaletteSelector
                  );
                }}
                title={i18n.settings.tooltips.addColor}
              >
                +
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Add new palette input */}
      <div className="mk-palette-add-section">
        <input
          type="text"
          className="mk-palette-add-input"
          placeholder={i18n.labels.newPaletteName || "New palette name..."}
          value={newPaletteName}
          onChange={(e) => setNewPaletteName(e.target.value)}
          onKeyPress={handleNewPaletteKeyPress}
        />
        <button
          className="mk-button-primary"
          onClick={createNewPalette}
          disabled={!newPaletteName.trim()}
        >
          Create
        </button>
        <button
          className="mk-button-primary"
          onClick={() => setShowImportArea(!showImportArea)}
          title={
            i18n.settings.tooltips.importPalette || "Import palette from JSON"
          }
        >
          Import
        </button>
      </div>

      {/* Import Area */}
      {showImportArea && (
        <div className="mk-palette-import-section">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              width: "100%",
            }}
          >
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste your palette JSON here..."
              style={{
                width: "100%",
                minHeight: "200px",
                fontFamily: "monospace",
                fontSize: "12px",
                padding: "8px",
                border: "1px solid var(--background-modifier-border)",
                borderRadius: "4px",
                backgroundColor: "var(--background-primary)",
              }}
            />
            {importError && (
              <div style={{ color: "var(--text-error)", fontSize: "12px" }}>
                {importError}
              </div>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="mod-cta"
                onClick={importPaletteFromText}
                disabled={!importText.trim()}
              >
                Import
              </button>
              <button
                onClick={() => {
                  setShowImportArea(false);
                  setImportText("");
                  setImportError("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ColorPaletteSettings = ({ superstate }: SettingsProps) => {
  return (
    <>
      <div className="mk-setting-section">
        <h2>{i18n.labels.colors}</h2>

        <div className="mk-community-callout">
          <div className="mk-callout-icon">💡</div>
          <div className="mk-callout-content">
            <div className="mk-callout-text">
              Find and share color palettes with the community at{" "}
              <span
                className="mk-callout-url"
                onClick={() =>
                  window.open("https://make.md/community", "_blank")
                }
                style={{ cursor: "pointer" }}
              >
                https://make.md/community
              </span>
            </div>
          </div>
        </div>

        <div className="mk-setting-group">
          <div className="mk-setting-content-full">
            <ColorPaletteManager superstate={superstate} />
          </div>
        </div>
      </div>
    </>
  );
};
