import { Superstate, i18n, i18nLoader } from "makemd-core";
import React, { useState } from "react";
import { SettingsProps } from "./types";

export const LanguageSettings = ({ superstate }: SettingsProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [modifiedStrings, setModifiedStrings] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [showImportArea, setShowImportArea] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [originalStrings, setOriginalStrings] = useState<Record<string, string>>({});

  // Load lang.json on mount
  React.useEffect(() => {
    const loadLangFile = async () => {
      try {
        // First, capture all original values before applying any overrides
        const originals: Record<string, string> = {};
        const captureOriginals = (obj: any, prefix = "") => {
          for (const key in obj) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
              captureOriginals(obj[key], fullKey);
            } else if (typeof obj[key] === "string") {
              originals[fullKey] = obj[key];
            }
          }
        };
        captureOriginals(i18n);
        setOriginalStrings(originals);

        // Then load any existing overrides
        const langPath = ".space/lang.json";
        const content = await superstate.spaceManager.readPath(langPath);
        if (content) {
          const langData = JSON.parse(content);
          setModifiedStrings(langData);
          i18nLoader.setOverridesFromFile(langData);
        }
      } catch (e) {
        // File doesn't exist yet, that's ok
      }
      setLoading(false);
    };
    loadLangFile();
  }, [superstate]);

  const allStrings = React.useMemo(() => {
    const result: Array<{ key: string; value: string; category: string }> = [];
    
    // Use originalStrings if available, otherwise flatten current i18n
    if (Object.keys(originalStrings).length > 0) {
      Object.entries(originalStrings).forEach(([key, value]) => {
        const category = key.split(".")[0];
        result.push({ key, value, category });
      });
    } else {
      // Fallback to flattening current i18n (though this might have overrides)
      const flatten = (obj: any, prefix = "") => {
        for (const key in obj) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          const category = prefix ? prefix.split(".")[0] : key;
          
          if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
            flatten(obj[key], fullKey);
          } else if (typeof obj[key] === "string") {
            result.push({ key: fullKey, value: obj[key], category });
          }
        }
      };
      flatten(i18n);
    }
    
    return result;
  }, [originalStrings]);

  const filteredStrings = allStrings.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.value.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Group strings by category
  const groupedStrings = filteredStrings.reduce((groups, item) => {
    const category = item.category || "Other";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, Array<{ key: string; value: string; category: string }>>);

  const sortedCategories = Object.keys(groupedStrings).sort();

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleChange = (key: string, newValue: string) => {
    const newModified = { ...modifiedStrings };

    // Get the original value from our stored original strings
    const originalValue = originalStrings[key] || "";

    if (newValue === originalValue) {
      // If the value is back to original, remove from overrides
      delete newModified[key];
    } else {
      // Otherwise, save the override
      newModified[key] = newValue;
    }

    setModifiedStrings(newModified);
  };

  const handleBlur = async (key: string, newValue: string) => {
    // First update the state
    handleChange(key, newValue);
    
    // Then save to file
    const newModified = { ...modifiedStrings };
    const originalValue = originalStrings[key] || "";

    if (newValue === originalValue) {
      delete newModified[key];
    } else {
      newModified[key] = newValue;
    }

    try {
      const langPath = ".space/lang.json";

      // Ensure .space directory exists
      try {
        await superstate.spaceManager.createSpace(".space", "", {});
      } catch (e) {
        // Directory might already exist
      }

      // Write the lang.json file
      await superstate.spaceManager.writeToPath(
        langPath,
        JSON.stringify(newModified, null, 2)
      );

      // Apply the overrides to the current session
      i18nLoader.setOverridesFromFile(newModified);
    } catch (e) {
      console.error("Failed to auto-save language settings:", e);
    }
  };

  const saveChanges = async () => {
    try {
      const langPath = ".space/lang.json";

      // Ensure .space directory exists
      try {
        await superstate.spaceManager.createSpace(".space", "", {});
      } catch (e) {
        // Directory might already exist
      }

      // Write the lang.json file
      await superstate.spaceManager.writeToPath(
        langPath,
        JSON.stringify(modifiedStrings, null, 2)
      );

      // Apply the overrides to the current session
      i18nLoader.setOverridesFromFile(modifiedStrings);

      // Force a re-render
      window.location.reload();
    } catch (e) {
      console.error("Failed to save language settings:", e);
    }
  };

  const resetAll = async () => {
    try {
      const langPath = ".space/lang.json";

      // Delete the lang.json file
      try {
        await superstate.spaceManager.deletePath(langPath);
      } catch (e) {
        // File might not exist
      }

      setModifiedStrings({});
      i18nLoader.setOverridesFromFile({});

      window.location.reload();
    } catch (e) {
      console.error("Failed to reset language settings:", e);
    }
  };

  const getValue = (key: string) => {
    return (
      modifiedStrings[key] ||
      key.split(".").reduce((obj, k) => obj?.[k], i18n as any) ||
      ""
    );
  };

  const hasChanges = Object.keys(modifiedStrings).length > 0;

  const exportJSON = () => {
    // Export the entire i18n tree with overrides applied
    const exportData = JSON.parse(JSON.stringify(i18n));
    
    // Apply overrides to the export data
    Object.entries(modifiedStrings).forEach(([key, value]) => {
      const keys = key.split(".");
      let current = exportData;
      
      // Navigate to the parent object
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      // Set the value
      current[keys[keys.length - 1]] = value;
    });
    
    const jsonString = JSON.stringify(exportData, null, 2);
    navigator.clipboard.writeText(jsonString);
    
    // Show success feedback (could add a toast notification here)
    const button = document.activeElement as HTMLButtonElement;
    if (button) {
      const originalText = button.textContent;
      button.textContent = i18n.settings.language.copied;
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    }
  };

  const importJSON = () => {
    try {
      setImportError("");
      const importData = JSON.parse(importText);
      
      // Flatten the imported data to match our override format
      const flatImported: Array<{ key: string; value: string }> = [];
      const flatten = (obj: any, prefix = "") => {
        for (const key in obj) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
            flatten(obj[key], fullKey);
          } else if (typeof obj[key] === "string") {
            flatImported.push({ key: fullKey, value: obj[key] });
          }
        }
      };
      flatten(importData);
      
      const overrides: Record<string, string> = {};
      
      // Compare with original values and only store overrides
      flatImported.forEach(({ key, value }) => {
        const originalValue = originalStrings[key] || "";
        
        if (value !== originalValue) {
          overrides[key] = value;
        }
      });
      
      setModifiedStrings(overrides);
      setShowImportArea(false);
      setImportText("");
    } catch (e) {
      setImportError(i18n.settings.language.invalidJSON);
    }
  };

  if (loading) {
    return (
      <div className="mk-setting-section">
        <h2>{i18n.settings.sections.language}</h2>
        <div className="mk-setting-group">
          <div className="mk-setting-item">
            <div className="mk-setting-item-info">
              <div className="mk-setting-item-name">
                {i18n.settings.language.loadingSettings}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mk-setting-section">
      <h2>Language</h2>
      <div className="mk-setting-group">
        <div className="mk-setting-item">
          <div
            className="mk-setting-item-control"
            style={{ gap: "8px", display: "flex", flexWrap: "wrap" }}
          >
            <button
              className="mod-cta"
              onClick={() => window.location.reload()}
            >
              {i18n.buttons.refresh || "Refresh"}
            </button>
            <button
              className="mod-destructive"
              onClick={resetAll}
              disabled={!hasChanges}
            >
              {i18n.settings.language.resetAll}
            </button>
            <button onClick={exportJSON}>{i18n.settings.language.exportJSON}</button>
            <button onClick={() => setShowImportArea(!showImportArea)}>
              {i18n.settings.language.importJSON}
            </button>
          </div>
        </div>

        {showImportArea && (
          <div className="mk-setting-item">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={i18n.settings.language.pasteJSONPlaceholder}
                  style={{
                    width: "100%",
                    minHeight: "200px",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    padding: "8px",
                    border: "1px solid var(--background-modifier-border)",
                    borderRadius: "4px",
                    backgroundColor: "var(--background-primary)"
                  }}
                />
                {importError && (
                  <div style={{ color: "var(--text-error)", fontSize: "12px" }}>
                    {importError}
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="mod-cta" onClick={importJSON} disabled={!importText.trim()}>
                    {i18n.settings.language.import}
                  </button>
                  <button onClick={() => {
                    setShowImportArea(false);
                    setImportText("");
                    setImportError("");
                  }}>
                    {i18n.settings.language.cancel}
                  </button>
                </div>
            </div>
          </div>
        )}

        <div className="mk-setting-item">
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="text"
              placeholder={`${i18n.settings.language.search}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", paddingRight: "60px" }}
            />
            <div style={{ 
              position: "absolute", 
              right: "8px", 
              top: "50%", 
              transform: "translateY(-50%)",
              color: "var(--text-muted)", 
              fontSize: "12px",
              pointerEvents: "none"
            }}>
              {filteredStrings.length}/{allStrings.length}
            </div>
          </div>
        </div>

        <div className="mk-setting-content-full">
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {sortedCategories.map((category) => (
              <div key={category} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "13px",
                    color: "var(--text-normal)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    userSelect: "none",
                  }}
                  onClick={() => toggleCategory(category)}
                >
                  <span>
                    {category.charAt(0).toUpperCase() + category.slice(1)} (
                    {groupedStrings[category].length})
                  </span>
                  <div
                    className="mk-icon-small"
                    style={{
                      transform: collapsedCategories.has(category) ? "rotate(0deg)" : "rotate(90deg)",
                      transition: "transform 0.2s ease",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: superstate.ui.getSticker("ui//collapse"),
                    }}
                  />
                </div>
                {!collapsedCategories.has(category) ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {groupedStrings[category].map((item) => {
                    const currentValue = getValue(item.key);
                    const isModified = Object.prototype.hasOwnProperty.call(
                      modifiedStrings,
                      item.key
                    );

                    return (
                      <div
                        key={item.key}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "12px",
                          backgroundColor: isModified
                            ? "var(--background-modifier-hover)"
                            : "transparent",
                          alignItems: "start",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              fontSize: "14px",
                              color: isModified ? "var(--text-muted)" : "var(--text-normal)",
                              wordBreak: "break-word",
                              fontStyle: isModified ? "italic" : "normal",
                            }}
                          >
                            {item.value}
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={currentValue}
                            onChange={(e) =>
                              handleChange(item.key, e.target.value)
                            }
                            onBlur={(e) =>
                              handleBlur(item.key, e.target.value)
                            }
                            style={{
                              width: "100%",
                              backgroundColor: isModified
                                ? "var(--background-modifier-hover)"
                                : "var(--background-primary)",
                              fontSize: "12px",
                              padding: "6px 8px",
                            }}
                            placeholder={item.value}
                          />
                        </div>
                      </div>
                    );
                  })}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};