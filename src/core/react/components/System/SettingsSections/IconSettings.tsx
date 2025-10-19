import { showSpacesMenu } from "core/react/components/UI/Menus/properties/selectSpaceMenu";
import JSZip from "jszip";
import { Superstate } from "makemd-core";
import i18n from "shared/i18n";
import React, { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { IconMetadata, IconsetAsset } from "shared/types/assets";
import { windowFromDocument } from "shared/utils/dom";
import { useDebouncedSave } from "./hooks";
import { SettingsProps } from "./types";

interface IconSet extends Omit<IconsetAsset, "icons"> {
  icons?: IconMetadata[];
}

const IconSetManager = ({ superstate }: { superstate: Superstate }) => {
  const [iconSets, setIconSets] = useState<IconSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSet, setSelectedSet] = useState<string | null>(null);
  const [iconsList, setIconsList] = useState<IconMetadata[]>([]);
  const [dropHighlighted, setDropHighlighted] = useState(false);

  React.useEffect(() => {
    loadIconSets();
  }, [superstate]);

  const loadIconSets = async () => {
    try {
      setLoading(true);

      // Get asset manager
      const assetManager = superstate.assets;

      if (assetManager) {
        // Get all iconsets from asset manager
        if (assetManager.getIconsets) {
          const allIconSets = assetManager.getIconsets() as IconSet[];

          if (allIconSets && allIconSets.length > 0) {
            // Filter out UI iconsets
            const filteredSets = allIconSets.filter(
              (set) => set.id !== "ui" && set.id !== "default-ui"
            );

            // Ensure Lucide and Emoji are at the top if they exist
            const lucideSet = filteredSets.find((s) => s.id === "lucide");
            const emojiSet = filteredSets.find((s) => s.id === "emoji");
            const customSets = filteredSets.filter(
              (s) => s.id !== "lucide" && s.id !== "emoji"
            );

            const finalSets = [];
            if (lucideSet) finalSets.push(lucideSet);
            if (emojiSet) finalSets.push(emojiSet);
            finalSets.push(...customSets);

            setIconSets(finalSets);

            // Load icons for each set
            for (const set of finalSets) {
              await loadIconsForSet(set.id);
            }
          } else {
            setIconSets([]);
          }
        } else {
          setIconSets([]);
        }
      } else {
        setIconSets([]);
      }
    } catch (e) {
      setIconSets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadIconsForSet = async (setId: string) => {
    try {
      const assetManager = superstate.assets;

      if (assetManager) {
        let icons: IconMetadata[] = [];

        // Method 1: Get iconset and check its icons property
        const iconset = assetManager.getAsset?.(setId) as IconsetAsset | null;
        if (iconset && iconset.icons) {
          icons = iconset.icons;
        }

        // Method 2: Use getIconFromSet to get individual icons
        if (icons.length === 0 && assetManager.getIconFromSet) {
          // For known sets, we can try common icon names
          if (setId === "lucide") {
            const commonIcons = [
              "file",
              "folder",
              "settings",
              "search",
              "home",
              "user",
              "calendar",
              "clock",
            ];
            icons = commonIcons.map(
              (name) => ({ id: name, name } as IconMetadata)
            );
          } else if (setId === "emoji") {
            const commonEmojis = [
              "😊",
              "🎉",
              "🚀",
              "💡",
              "❤️",
              "⭐",
              "🔥",
              "👍",
            ];
            icons = commonEmojis.map(
              (emoji) => ({ id: emoji, name: emoji } as IconMetadata)
            );
          }
        }

        // Method 3: Use searchAssets to find icons for this set
        if (icons.length === 0 && assetManager.searchAssets) {
          const searchResults = assetManager.searchAssets(`iconset:${setId}`);
          if (searchResults && searchResults.length > 0) {
            // Convert Asset[] to IconMetadata[]
            icons = searchResults.map(
              (asset) =>
                ({
                  id: asset.id,
                  name: asset.name,
                  path: asset.path,
                } as IconMetadata)
            );
          }
        }

        // Update the iconset with its icons
        setIconSets((prev) =>
          prev.map((set) =>
            set.id === setId ? { ...set, icons: icons || [] } : set
          )
        );
      }
    } catch (e) {}
  };

  const addIconSetFromFolder = (e: React.MouseEvent) => {
    const offset = (e.currentTarget as HTMLElement).getBoundingClientRect();

    e.stopPropagation();

    showSpacesMenu(
      offset,
      windowFromDocument(e.view.document),
      superstate,
      async (path: string, isNew?: boolean, type?: string) => {
        // Check if the path exists and create icon set
        if (path) {
          try {
            await createIconSetFromFolder(path);
          } catch (e) {}
        } else {
        }
      },
      false, // includeDefaults
      false, // canAdd
      false, // onlyTags - false means show folders
      true
    );
  };

  const extractStickerPack = useCallback(
    async (file: File): Promise<IconMetadata[]> => {
      try {
        const zip = new JSZip();
        const zipData = await zip.loadAsync(file);
        const icons: IconMetadata[] = [];

        for (const [fileName, zipFile] of Object.entries(zipData.files)) {
          // Skip directories and hidden files
          if (
            zipFile.dir ||
            fileName.startsWith(".") ||
            fileName.includes("__MACOSX")
          ) {
            continue;
          }

          // Only process image files
          const isImageFile = /\.(svg|png|jpg|jpeg|gif|webp)$/i.test(fileName);
          if (!isImageFile) {
            continue;
          }

          // Get the icon name (remove file extension and path)
          const iconName =
            fileName
              .split("/")
              .pop()
              ?.replace(/\.[^/.]+$/, "") || fileName;

          // Get file data as blob for storage
          const fileData = await zipFile.async("blob");
          const fileExtension =
            fileName.split(".").pop()?.toLowerCase() || "png";

          icons.push({
            id: iconName,
            name: iconName,
            path: `${iconName}.${fileExtension}`,
            // Store the blob data for asset manager
            data: fileData,
          } as IconMetadata & { data: Blob });
        }

        return icons;
      } catch (error) {
        console.error("Failed to extract sticker pack:", error);
        throw new Error(i18n.notice.invalidStickerPackFile);
      }
    },
    []
  );

  const handleFileDrop = useCallback(
    async (files: File[]) => {
      try {
        let allIcons: IconMetadata[] = [];
        let iconsetName = "";

        for (const file of files) {
          if (file.name.endsWith(".zip")) {
            // Handle sticker pack (zip file)
            iconsetName = file.name.replace(/\.zip$/i, "");
            const extractedIcons = await extractStickerPack(file);
            allIcons = [...allIcons, ...extractedIcons];
          } else if (
            file.type.startsWith("image/") ||
            file.name.endsWith(".svg")
          ) {
            // Handle individual image files
            const iconName = file.name.replace(/\.[^/.]+$/, "");
            allIcons.push({
              id: iconName,
              name: iconName,
              path: file.name,
              data: file,
            } as IconMetadata & { data: File });
          }
        }

        if (allIcons.length === 0) {
          superstate.ui.notify(
            "No valid icons found in dropped files",
            "error"
          );
          return;
        }

        // Generate iconset name if not set
        if (!iconsetName) {
          iconsetName = `Icons-${Date.now()}`;
        }

        let iconsetId = iconsetName.toLowerCase().replace(/[^a-z0-9]/g, "-");

        const assetManager = superstate.assets;
        if (!assetManager) {
          superstate.ui.notify("Asset manager not available", "error");
          return;
        }

        // Check if iconset ID already exists and make it unique
        const existingIconsets = assetManager.getIconsets?.() || [];
        let counter = 1;
        let uniqueId = iconsetId;

        while (existingIconsets.some((set) => set.id === uniqueId)) {
          uniqueId = `${iconsetId}-${counter}`;
          counter++;
        }

        iconsetId = uniqueId;

        // Create the iconset asset
        const iconsetAsset: IconsetAsset = {
          id: iconsetId,
          name: iconsetName,
          path: `.space/assets/icons/${iconsetId}`,
          type: "iconset",
          description: files.some((f) => f.name.endsWith(".zip"))
            ? `Sticker pack extracted from ${
                files.find((f) => f.name.endsWith(".zip"))?.name
              }`
            : `Icon set created from dropped files`,
          tags: ["custom", "user"],
          icons: allIcons.map((icon) => ({
            id: icon.id,
            name: icon.name,
            path: icon.path,
          })),
          theme: "auto",
          format: "mixed",
          created: Date.now(),
          modified: Date.now(),
        };

        // Create the icon folder path
        const iconFolderPath = `.space/assets/icons/${iconsetId}`;

        // Ensure the icon folder exists by creating the folder structure
        const folderParts = iconFolderPath.split("/");
        let currentPath = "";
        for (const part of folderParts) {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          if (!(await superstate.spaceManager.pathExists(currentPath))) {
            // Create folder using createItemAtPath with type 'folder'
            await superstate.spaceManager.createItemAtPath(
              currentPath.substring(0, currentPath.lastIndexOf("/")) || "/",
              "folder",
              part
            );
          }
        }

        // Save each icon file using spaceManager.createItemAtPath
        for (const icon of allIcons) {
          const iconData = (icon as any).data;
          if (iconData) {
            const fileExtension =
              icon.path.split(".").pop()?.toLowerCase() || "svg";

            // Convert blob/file to appropriate content
            let content: string | ArrayBuffer;
            if (iconData instanceof Blob || iconData instanceof File) {
              if (fileExtension === "svg" || fileExtension === "xml") {
                // For SVG files, read as text
                content = await iconData.text();
              } else {
                // For binary image files (PNG, JPG, etc.), read as ArrayBuffer
                content = await iconData.arrayBuffer();
              }
            } else {
              content = iconData;
            }

            // Create the icon file at the proper path
            await superstate.spaceManager.createItemAtPath(
              iconFolderPath,
              fileExtension,
              icon.id,
              content
            );
          }
        }

        // Save the iconset metadata with the asset manager
        await assetManager.saveIconset(iconsetAsset);

        // Reload iconsets to get the updated list
        if (assetManager.reindexAssets) {
          await assetManager.reindexAssets();
        }

        // Reload sticker sets in the UI
        await loadIconSets();

        const packType = files.some((f) => f.name.endsWith(".zip"))
          ? i18n.settings.stickerPack
          : "icon files";
        superstate.ui.notify(
          `Added ${allIcons.length} icons from ${packType} to "${iconsetName}"`
        );
      } catch (e) {
        console.error("Failed to create icon set from dropped files:", e);
        const errorMessage =
          e instanceof Error
            ? e.message
            : "Failed to create icon set from dropped files";
        superstate.ui.notify(errorMessage, "error");
      }
    },
    [superstate, loadIconSets, extractStickerPack]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      handleFileDrop(acceptedFiles);
      setDropHighlighted(false);
    },
    [handleFileDrop]
  );

  const onDragEnter = useCallback(() => {
    setDropHighlighted(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setDropHighlighted(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter,
    onDragLeave,
    accept: {
      "image/*": [".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/zip": [".zip"],
      "application/x-zip-compressed": [".zip"],
    },
    noClick: true,
  });

  const createIconSetFromFolder = async (folderPath: string) => {
    try {
      const folderName = folderPath.split("/").pop() || "icons";
      let iconsetId = folderName.toLowerCase().replace(/[^a-z0-9]/g, "-");

      const assetManager = superstate.assets;
      if (!assetManager) {
        return;
      }

      // Check if iconset ID already exists and make it unique
      const existingIconsets = assetManager.getIconsets?.() || [];
      let counter = 1;
      let uniqueId = iconsetId;

      while (existingIconsets.some((set) => set.id === uniqueId)) {
        uniqueId = `${iconsetId}-${counter}`;
        counter++;
      }

      iconsetId = uniqueId;

      // Let the asset manager handle scanning the folder and creating the iconset
      try {
        // Create a basic iconset asset and let the asset manager scan the folder
        const iconsetAsset: IconsetAsset = {
          id: iconsetId,
          name: folderName,
          path: folderPath,
          type: "iconset",
          description: `Icon set created from ${folderPath}`,
          tags: ["custom", "user"],
          icons: [], // Asset manager will scan and populate this
          theme: "auto",
          format: "mixed",
          created: Date.now(),
          modified: Date.now(),
        };

        await assetManager.saveIconset(iconsetAsset);

        // Reload iconsets to get the updated list
        if (assetManager.reindexAssets) {
          await assetManager.reindexAssets();
        }
      } catch (e) {
        return;
      }

      // Reload sticker sets in the UI
      await loadIconSets();
    } catch (e) {}
  };

  const deleteIconSet = async (iconsetId: string) => {
    try {
      // Delete iconset via asset manager (handles both memory and file persistence)
      const assetManager = superstate.assets;
      if (assetManager && assetManager.deleteIconset) {
        try {
          await assetManager.deleteIconset(iconsetId);
        } catch (e) {
          return;
        }
      } else {
        return;
      }

      // Reload sticker sets in the UI
      await loadIconSets();
    } catch (e) {}
  };

  const getPreviewIcons = (set: IconSet) => {
    // Special preview icons for known sets
    if (set.id === "emoji") {
      return ["😊", "🎉", "🚀", "💡"];
    }

    // For all other sets, use the first 4 icons from the set
    if (set.icons && set.icons.length > 0) {
      // Get icon names/ids from the set
      const iconNames = set.icons
        .slice(0, 4)
        .map((icon) =>
          typeof icon === "string" ? icon : icon.id || icon.name
        );
      return iconNames;
    }

    // Default preview icons
    return ["file", "folder", "settings", "search"];
  };

  if (loading) {
    return (
      <div className="mk-icon-set-manager">
        {i18n.labels.loadingStickerSets}
      </div>
    );
  }

  return (
    <div
      className="mk-icon-set-manager"
      {...getRootProps()}
      style={{ position: "relative" }}
    >
      <input {...getInputProps()} />
      {/* Drop zone hint */}
      {dropHighlighted && (
        <div
          className="mk-drop-zone-overlay"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "var(--background-modifier-hover)",
            border: "2px dashed var(--interactive-accent)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              padding: "20px",
              backgroundColor: "var(--background-primary)",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <div
              className="mk-icon-large"
              dangerouslySetInnerHTML={{
                __html: superstate.ui.getSticker("lucide//download"),
              }}
              style={{ marginBottom: "10px" }}
            />
            <div style={{ fontWeight: "bold" }}>
              {i18n.labels.dropIconsHere ||
                "Drop sticker pack (.zip) or icons here to create a new icon set"}
            </div>
          </div>
        </div>
      )}

      <div className="mk-icon-sets-grid">
        {iconSets.map((set) => {
          const previewIcons = getPreviewIcons(set);
          return (
            <div
              key={set.id}
              className={`mk-icon-set-card ${
                selectedSet === set.id ? "mk-selected" : ""
              }`}
              onClick={() => {
                setSelectedSet(selectedSet === set.id ? null : set.id);
                if (
                  selectedSet !== set.id &&
                  set.icons &&
                  set.icons.length > 0
                ) {
                  setIconsList(set.icons);
                } else {
                  setIconsList([]);
                }
              }}
            >
              <div className="mk-icon-set-card-header">
                <h4 className="mk-icon-set-name">{set.name}</h4>
                {!set.tags?.includes("builtin") && (
                  <button
                    className="mk-icon-set-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteIconSet(set.id);
                    }}
                    title={i18n.settings.tooltips.deleteStickerSet}
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="mk-icon-set-preview">
                {previewIcons.map((iconName, index) => {
                  // Handle emoji differently
                  if (set.id === "emoji") {
                    return (
                      <div key={index} className="mk-icon-preview-item">
                        <div className="mk-icon-medium mk-emoji-icon">
                          {iconName}
                        </div>
                      </div>
                    );
                  }

                  // Construct icon path
                  const iconPath = `${set.id}//${iconName}`;

                  // Get the sticker content using superstate.ui.getSticker
                  const stickerContent = superstate.ui.getSticker(iconPath);

                  return (
                    <div key={index} className="mk-icon-preview-item">
                      <div
                        className="mk-icon-medium"
                        dangerouslySetInnerHTML={{
                          __html:
                            stickerContent ||
                            superstate.ui.getSticker(`lucide//help-circle`),
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mk-icon-set-meta">
                {set.id === "lucide"
                  ? i18n.labels.iconLibrary
                  : set.id === "emoji"
                  ? i18n.labels.emojiLibrary
                  : i18n.labels.iconCount.replace(
                      "${1}",
                      String(set.icons?.length || 0)
                    )}
                {set.tags?.includes("builtin") && ` • ${i18n.labels.builtin}`}
                {set.tags?.includes("custom") && ` • ${i18n.labels.custom}`}
              </div>
            </div>
          );
        })}

        {/* Add new icon set button */}
        <div
          className="mk-icon-set-card mk-icon-set-add"
          onClick={addIconSetFromFolder}
        >
          <div className="mk-icon-set-add-content">
            <div
              className="mk-icon-large"
              dangerouslySetInnerHTML={{
                __html: superstate.ui.getSticker("lucide//plus"),
              }}
            />
            <span>{i18n.labels.addStickerSet}</span>
          </div>
        </div>
      </div>

      {/* Icon Browser */}
      {selectedSet && iconsList.length > 0 && (
        <div className="mk-icon-browser">
          <h4>
            {i18n.labels.iconsIn.replace(
              "${1}",
              iconSets.find((s) => s.id === selectedSet)?.name || ""
            )}
          </h4>
          <div className="mk-icon-grid">
            {iconsList.slice(0, 100).map((icon, index) => {
              const iconName =
                typeof icon === "string" ? icon : icon.id || icon.name;

              if (selectedSet === "emoji") {
                // For emoji set, show the emoji directly
                return (
                  <div key={index} className="mk-icon-grid-item">
                    <div className="mk-icon-small mk-emoji-icon">
                      {iconName}
                    </div>
                    <div className="mk-icon-label">{iconName}</div>
                  </div>
                );
              }

              // For other sets, load via getSticker
              const iconPath = `${selectedSet}//${iconName}`;
              const stickerContent = superstate.ui.getSticker(iconPath);

              return (
                <div key={index} className="mk-icon-grid-item">
                  <div
                    className="mk-icon-small"
                    dangerouslySetInnerHTML={{
                      __html:
                        stickerContent ||
                        superstate.ui.getSticker(`lucide//help-circle`),
                    }}
                  />
                  <div className="mk-icon-label">{iconName}</div>
                </div>
              );
            })}
          </div>
          {iconsList.length > 100 && (
            <div className="mk-icon-browser-note">
              {i18n.labels.showingFirst
                .replace("${1}", "100")
                .replace("${2}", String(iconsList.length))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const IconSettings = ({ superstate }: SettingsProps) => {
  const { debouncedSave, immediateSave } = useDebouncedSave(superstate);
  const [spacesStickers, setSpacesStickers] = useState(
    Boolean(superstate.settings.spacesStickers)
  );
  const [indexSVG, setIndexSVG] = useState(
    Boolean(superstate.settings.indexSVG)
  );
  const [dropHighlighted, setDropHighlighted] = useState(false);

  // Sync state with superstate.settings when component mounts or settings change
  useEffect(() => {
    setSpacesStickers(Boolean(superstate.settings.spacesStickers));
    setIndexSVG(Boolean(superstate.settings.indexSVG));
  }, [superstate.settings]);

  const handleStickerPackDrop = useCallback(
    async (files: File[]) => {
      try {
        let allIcons: IconMetadata[] = [];
        let iconsetName = "";

        for (const file of files) {
          if (file.name.endsWith(".zip")) {
            // Handle sticker pack (zip file) - reuse the extractStickerPack function
            iconsetName = file.name.replace(/\.zip$/i, "");
            const zip = new JSZip();
            const zipData = await zip.loadAsync(file);

            for (const [fileName, zipFile] of Object.entries(zipData.files)) {
              if (
                zipFile.dir ||
                fileName.startsWith(".") ||
                fileName.includes("__MACOSX")
              ) {
                continue;
              }

              const isImageFile = /\.(svg|png|jpg|jpeg|gif|webp)$/i.test(
                fileName
              );
              if (!isImageFile) {
                continue;
              }

              const iconName =
                fileName
                  .split("/")
                  .pop()
                  ?.replace(/\.[^/.]+$/, "") || fileName;
              const fileData = await zipFile.async("blob");
              const fileExtension =
                fileName.split(".").pop()?.toLowerCase() || "png";

              allIcons.push({
                id: iconName,
                name: iconName,
                path: `${iconName}.${fileExtension}`,
                data: fileData,
              } as IconMetadata & { data: Blob });
            }
          } else if (
            file.type.startsWith("image/") ||
            file.name.endsWith(".svg")
          ) {
            // Handle individual image files
            const iconName = file.name.replace(/\.[^/.]+$/, "");
            allIcons.push({
              id: iconName,
              name: iconName,
              path: file.name,
              data: file,
            } as IconMetadata & { data: File });
          }
        }

        if (allIcons.length === 0) {
          superstate.ui.notify(
            "No valid icons found in dropped files",
            "error"
          );
          return;
        }

        // Generate iconset name if not set
        if (!iconsetName) {
          iconsetName = `Icons-${Date.now()}`;
        }

        let iconsetId = iconsetName.toLowerCase().replace(/[^a-z0-9]/g, "-");

        const assetManager = superstate.assets;
        if (!assetManager) {
          superstate.ui.notify("Asset manager not available", "error");
          return;
        }

        // Check if iconset ID already exists and make it unique
        const existingIconsets = assetManager.getIconsets?.() || [];
        let counter = 1;
        let uniqueId = iconsetId;

        while (existingIconsets.some((set) => set.id === uniqueId)) {
          uniqueId = `${iconsetId}-${counter}`;
          counter++;
        }

        iconsetId = uniqueId;

        // Create the iconset asset
        const iconsetAsset: IconsetAsset = {
          id: iconsetId,
          name: iconsetName,
          path: `.space/assets/icons/${iconsetId}`,
          type: "iconset",
          description: files.some((f) => f.name.endsWith(".zip"))
            ? `Sticker pack extracted from ${
                files.find((f) => f.name.endsWith(".zip"))?.name
              }`
            : `Icon set created from dropped files`,
          tags: ["custom", "user"],
          icons: allIcons.map((icon) => ({
            id: icon.id,
            name: icon.name,
            path: icon.path,
          })),
          theme: "auto",
          format: "mixed",
          created: Date.now(),
          modified: Date.now(),
        };

        // Create the icon folder path
        const iconFolderPath = `.space/assets/icons/${iconsetId}`;

        // Ensure the icon folder exists by creating the folder structure
        const folderParts = iconFolderPath.split("/");
        let currentPath = "";
        for (const part of folderParts) {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          if (!(await superstate.spaceManager.pathExists(currentPath))) {
            // Create folder using createItemAtPath with type 'folder'
            await superstate.spaceManager.createItemAtPath(
              currentPath.substring(0, currentPath.lastIndexOf("/")) || "/",
              "folder",
              part
            );
          }
        }

        // Save each icon file using spaceManager.createItemAtPath
        for (const icon of allIcons) {
          const iconData = (icon as any).data;
          if (iconData) {
            const fileExtension =
              icon.path.split(".").pop()?.toLowerCase() || "svg";

            // Convert blob/file to appropriate content
            let content: string | ArrayBuffer;
            if (iconData instanceof Blob || iconData instanceof File) {
              if (fileExtension === "svg" || fileExtension === "xml") {
                // For SVG files, read as text
                content = await iconData.text();
              } else {
                // For binary image files (PNG, JPG, etc.), read as ArrayBuffer
                content = await iconData.arrayBuffer();
              }
            } else {
              content = iconData;
            }

            // Create the icon file at the proper path
            await superstate.spaceManager.createItemAtPath(
              iconFolderPath,
              fileExtension,
              icon.id,
              content
            );
          }
        }

        // Save the iconset metadata with the asset manager
        await assetManager.saveIconset(iconsetAsset);

        // Reload iconsets to get the updated list
        if (assetManager.reindexAssets) {
          await assetManager.reindexAssets();
        }

        const packType = files.some((f) => f.name.endsWith(".zip"))
          ? i18n.settings.stickerPack
          : "icon files";
        superstate.ui.notify(
          `Added ${allIcons.length} icons from ${packType} to "${iconsetName}"`
        );
      } catch (e) {
        console.error("Failed to create icon set from dropped files:", e);
        const errorMessage =
          e instanceof Error
            ? e.message
            : "Failed to create icon set from dropped files";
        superstate.ui.notify(errorMessage, "error");
      }
    },
    [superstate]
  );

  const onDropSettings = useCallback(
    (acceptedFiles: File[]) => {
      handleStickerPackDrop(acceptedFiles);
      setDropHighlighted(false);
    },
    [handleStickerPackDrop]
  );

  const onDragEnter = useCallback(() => {
    setDropHighlighted(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setDropHighlighted(false);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: useCallback(
      (acceptedFiles: File[]) => {
        handleStickerPackDrop(acceptedFiles);
        setDropHighlighted(false);
      },
      [handleStickerPackDrop]
    ),
    onDragEnter,
    onDragLeave,
    accept: {
      "image/*": [".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/zip": [".zip"],
      "application/x-zip-compressed": [".zip"],
    },
    noClick: true,
  });

  return (
    <div className="mk-setting-section">
      <h2>{i18n.labels.stickers}</h2>

      <div
        className="mk-community-callout"
        {...getRootProps()}
        style={{
          position: "relative",
          border: dropHighlighted
            ? "2px dashed var(--interactive-accent)"
            : undefined,
          backgroundColor: dropHighlighted
            ? "var(--background-modifier-hover)"
            : undefined,
        }}
      >
        <input {...getInputProps()} />
        <div className="mk-callout-icon">💡</div>
        <div className="mk-callout-content">
          <div className="mk-callout-text">
            {dropHighlighted ? (
              <>
                <strong>
                  {
                    i18n.descriptions
                      .dropStickerPackZipOrIndividualIconsHereToImport
                  }
                </strong>
                <br />
                Import sticker packs downloaded from the community or individual
                icon files
              </>
            ) : (
              <>
                Find and download sticker packs from the community at{" "}
                <span
                  className="mk-callout-url"
                  onClick={() =>
                    window.open("https://make.md/community", "_blank")
                  }
                  style={{ cursor: "pointer" }}
                >
                  https://make.md/community
                </span>
                <br />
                <small style={{ opacity: 0.7 }}>
                  {
                    i18n.descriptions
                      .dragAndDropZipStickerPacksOrIndividualIconFilesHereToImport
                  }
                </small>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mk-setting-group">
        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.spacesStickers.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.spacesStickers.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={spacesStickers}
              onChange={(e) => {
                setSpacesStickers(e.target.checked);
                superstate.settings.spacesStickers = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-item">
          <div className="mk-setting-item-info">
            <div className="mk-setting-item-name">
              {i18n.settings.indexSVG.name}
            </div>
            <div className="mk-setting-item-description">
              {i18n.settings.indexSVG.desc}
            </div>
          </div>
          <div className="mk-setting-item-control">
            <input
              type="checkbox"
              checked={indexSVG}
              onChange={(e) => {
                setIndexSVG(e.target.checked);
                superstate.settings.indexSVG = e.target.checked;
                immediateSave();
              }}
            />
          </div>
        </div>

        <div className="mk-setting-content-full">
          <IconSetManager superstate={superstate} />
        </div>
      </div>
    </div>
  );
};
