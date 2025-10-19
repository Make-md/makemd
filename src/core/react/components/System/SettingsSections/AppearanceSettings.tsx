import i18n from "shared/i18n";
import React, { useEffect, useState } from "react";
import { CoverImage } from "shared/types/assets";
import { useDebouncedSave } from "./hooks";
import { SettingsProps } from "./types";

export const CoverImageSettings = ({ superstate }: SettingsProps) => {
  const { debouncedSave, immediateSave } = useDebouncedSave(superstate);
  const [coverImages, setCoverImages] = useState<CoverImage[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [showImportArea, setShowImportArea] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");

  // Load cover images from asset manager
  useEffect(() => {
    const assetManager = (superstate as any).assets;

    if (assetManager && assetManager.getAllCoverImages) {
      const images = assetManager.getAllCoverImages();
      setCoverImages(images);
    } else {
    }
  }, [(superstate as any).assets]);

  // Function to derive name from URL
  const deriveNameFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split("/").pop() || "";

      // Remove file extension if present
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

      // If no filename, use the hostname
      if (!nameWithoutExt) {
        return urlObj.hostname;
      }

      // Replace hyphens and underscores with spaces and capitalize
      return nameWithoutExt
        .replace(/[-_]/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    } catch {
      // If URL is invalid, just use the input as is
      return url.split("/").pop()?.replace(/[-_]/g, " ") || url;
    }
  };

  const handleAddCoverImage = async () => {
    if (!urlInput.trim()) return;

    const derivedName = deriveNameFromUrl(urlInput.trim());

    const assetManager = (superstate as any).assets;
    if (assetManager && assetManager.addCoverImage) {
      try {
        const success = await assetManager.addCoverImage(
          urlInput.trim(),
          derivedName,
          []
        );

        if (success) {
          // Refresh the list
          const images = assetManager.getAllCoverImages();
          setCoverImages(images);

          // Clear inputs
          setUrlInput("");
        }
      } catch (error) {}
    }
  };

  const exportURLs = () => {
    const urlList = coverImages.map((image) => image.url).join("\n");
    navigator.clipboard.writeText(urlList);

    // Show success toast
    superstate.ui.notify(
      `Copied ${coverImages.length} cover image URLs to clipboard`
    );
  };

  const importURLs = async () => {
    try {
      setImportError("");

      // Split by lines and filter out empty lines
      const urls = importText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (urls.length === 0) {
        setImportError("No URLs found. Please enter one URL per line.");
        return;
      }

      const assetManager = (superstate as any).assets;
      if (assetManager) {
        // Add each URL
        for (const url of urls) {
          try {
            // Derive name from URL
            const derivedName = deriveNameFromUrl(url);
            await assetManager.addCoverImage(url, derivedName, []);
          } catch (error) {}
        }

        // Refresh the list
        const images = assetManager.getAllCoverImages();
        setCoverImages(images);
        setShowImportArea(false);
        setImportText("");
      }
    } catch (error) {
      setImportError("Error processing URLs. Please check your input.");
    }
  };

  const handleRemoveCoverImage = async (url: string) => {
    const assetManager = (superstate as any).assets;
    if (assetManager && assetManager.removeCoverImage) {
      const success = await assetManager.removeCoverImage(url);
      if (success) {
        // Refresh the list
        const images = assetManager.getAllCoverImages();
        setCoverImages(images);
      }
    }
  };

  return (
    <>
      <div className="mk-setting-section">
        <h2>{i18n.settings.sections.coverImage}</h2>

        <div className="mk-community-callout">
          <div className="mk-callout-icon">💡</div>
          <div className="mk-callout-content">
            <div className="mk-callout-text">
              Find cover images from the community at{" "}
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
          <div className="mk-setting-item">
            <div className="mk-setting-item-info">
              <div className="mk-setting-item-name">
                {i18n.settings.banners.name}
              </div>
              <div className="mk-setting-item-description">
                {i18n.settings.banners.desc}
              </div>
            </div>
            <div className="mk-setting-item-control">
              <input
                type="checkbox"
                checked={superstate.settings.banners}
                onChange={(e) => {
                  superstate.settings.banners = e.target.checked;
                  immediateSave();
                }}
              />
            </div>
          </div>

          <div className="mk-setting-item">
            <div className="mk-setting-item-info">
              <div className="mk-setting-item-name">
                {i18n.settings.bannerHeight.name}
              </div>
              <div className="mk-setting-item-description">
                {i18n.settings.bannerHeight.desc}
              </div>
            </div>
            <div className="mk-setting-item-control">
              <input
                type="number"
                value={superstate.settings.bannerHeight}
                onChange={(e) => {
                  superstate.settings.bannerHeight =
                    parseInt(e.target.value) || 200;
                  immediateSave();
                }}
              />
            </div>
          </div>
        </div>

        <div className="mk-setting-group">
          <div className="mk-cover-image-header">
            <div className="mk-cover-image-input-section">
              <input
                type="text"
                placeholder="Enter image URL and press Enter to add"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddCoverImage();
                  }
                }}
                className="mk-input mk-cover-image-url-input"
              />
            </div>
            <div className="mk-cover-image-actions">
              <button
                onClick={() => setShowImportArea(!showImportArea)}
                className="mk-button mk-button-secondary"
              >
                {i18n.settings.importUrls}
              </button>
              <button
                onClick={exportURLs}
                className="mk-button mk-button-secondary"
                disabled={coverImages.length === 0}
              >
                {i18n.settings.exportUrls}
              </button>
            </div>
          </div>

          {showImportArea && (
            <div className="mk-import-area">
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
                  placeholder={i18n.descriptions.pasteUrlsHereOnePerLine}
                  style={{
                    width: "100%",
                    minHeight: "150px",
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
                    onClick={importURLs}
                    disabled={!importText.trim()}
                  >
                    {i18n.buttons.import}
                  </button>
                  <button
                    onClick={() => {
                      setShowImportArea(false);
                      setImportText("");
                      setImportError("");
                    }}
                  >
                    {i18n.buttons.cancel}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mk-cover-images-grid">
            {coverImages.length === 0 ? (
              <div className="mk-empty-state">No cover images added yet</div>
            ) : (
              coverImages.map((image) => (
                <div key={image.url} className="mk-cover-image-item">
                  <div className="mk-cover-image-container">
                    <img src={image.url} alt={image.name} />
                    <div className="mk-cover-image-overlay">
                      <button
                        onClick={() => handleRemoveCoverImage(image.url)}
                        className="mk-cover-image-delete"
                        title={i18n.settings.removeImage}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="mk-cover-image-name">{image.name}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};
