import { showSpacesMenu } from "core/react/components/UI/Menus/properties/selectSpaceMenu";
import { Superstate, i18n } from "makemd-core";
import React, { useState, useEffect } from "react";
import { IconsetAsset, IconMetadata } from "shared/types/assets";
import { windowFromDocument } from "shared/utils/dom";
import { useDebouncedSave } from "./hooks";
import { SettingsProps } from "./types";

interface IconSet extends Omit<IconsetAsset, 'icons'> {
  icons?: IconMetadata[];
}

const IconSetManager = ({ superstate }: { superstate: Superstate }) => {
  const [iconSets, setIconSets] = useState<IconSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSet, setSelectedSet] = useState<string | null>(null);
  const [iconsList, setIconsList] = useState<IconMetadata[]>([]);

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
            const filteredSets = allIconSets.filter((set) => 
              set.id !== 'ui' && 
              set.id !== 'default-ui'
            );
            
            // Ensure Lucide and Emoji are at the top if they exist
            const lucideSet = filteredSets.find((s) => s.id === 'lucide');
            const emojiSet = filteredSets.find((s) => s.id === 'emoji');
            const customSets = filteredSets.filter((s) => s.id !== 'lucide' && s.id !== 'emoji');
            
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
          if (setId === 'lucide') {
            const commonIcons = ['file', 'folder', 'settings', 'search', 'home', 'user', 'calendar', 'clock'];
            icons = commonIcons.map(name => ({ id: name, name } as IconMetadata));
          } else if (setId === 'emoji') {
            const commonEmojis = ['😊', '🎉', '🚀', '💡', '❤️', '⭐', '🔥', '👍'];
            icons = commonEmojis.map(emoji => ({ id: emoji, name: emoji } as IconMetadata));
          }
        }
        
        // Method 3: Use searchAssets to find icons for this set
        if (icons.length === 0 && assetManager.searchAssets) {
          const searchResults = assetManager.searchAssets(`iconset:${setId}`);
          if (searchResults && searchResults.length > 0) {
            // Convert Asset[] to IconMetadata[]
            icons = searchResults.map(asset => ({
              id: asset.id,
              name: asset.name,
              path: asset.path
            } as IconMetadata));
          }
        }
        
        // Update the iconset with its icons
        setIconSets(prev => prev.map(set => 
          set.id === setId ? { ...set, icons: icons || [] } : set
        ));
      }
    } catch (e) {
    }
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
          } catch (e) {
          }
        } else {
        }
      },
      false, // includeDefaults
      false, // canAdd
      false  // onlyTags - false means show folders
    );
  };

  const createIconSetFromFolder = async (folderPath: string) => {
    try {
      const folderName = folderPath.split('/').pop() || 'icons';
      let iconsetId = folderName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      const assetManager = superstate.assets;
      if (!assetManager) {
        return;
      }
      
      // Check if iconset ID already exists and make it unique
      const existingIconsets = assetManager.getIconsets?.() || [];
      let counter = 1;
      let uniqueId = iconsetId;
      
      while (existingIconsets.some(set => set.id === uniqueId)) {
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
          type: 'iconset',
          description: `Icon set created from ${folderPath}`,
          tags: ['custom', 'user'],
          icons: [], // Asset manager will scan and populate this
          theme: 'auto',
          format: 'mixed',
          created: Date.now(),
          modified: Date.now()
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
    } catch (e) {
    }
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
    } catch (e) {
    }
  };

  const getPreviewIcons = (set: IconSet) => {
    // Special preview icons for known sets
    if (set.id === 'emoji') {
      return ["😊", "🎉", "🚀", "💡"];
    }
    
    // For all other sets, use the first 4 icons from the set
    if (set.icons && set.icons.length > 0) {
      // Get icon names/ids from the set
      const iconNames = set.icons.slice(0, 4).map((icon) => 
        typeof icon === 'string' ? icon : icon.id || icon.name
      );
      return iconNames;
    }
    
    // Default preview icons
    return ["file", "folder", "settings", "search"];
  };

  if (loading) {
    return <div className="mk-icon-set-manager">{i18n.labels.loadingStickerSets}</div>;
  }

  return (
    <div className="mk-icon-set-manager">
      <div className="mk-icon-sets-grid">
        {iconSets.map((set) => {
          const previewIcons = getPreviewIcons(set);
          return (
            <div 
              key={set.id} 
              className={`mk-icon-set-card ${selectedSet === set.id ? 'mk-selected' : ''}`}
              onClick={() => {
                setSelectedSet(selectedSet === set.id ? null : set.id);
                if (selectedSet !== set.id && set.icons && set.icons.length > 0) {
                  setIconsList(set.icons);
                } else {
                  setIconsList([]);
                }
              }}
            >
              <div className="mk-icon-set-card-header">
                <h4 className="mk-icon-set-name">{set.name}</h4>
                {(set.tags?.includes('custom') || set.tags?.includes('user')) && (
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
                  if (set.id === 'emoji') {
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
                          __html: stickerContent || superstate.ui.getSticker(`lucide//help-circle`),
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mk-icon-set-meta">
                {set.id === 'lucide' ? i18n.labels.iconLibrary : 
                 set.id === 'emoji' ? i18n.labels.emojiLibrary :
                 i18n.labels.iconCount.replace('${1}', String(set.icons?.length || 0))}
                {set.tags?.includes('builtin') && ` • ${i18n.labels.builtin}`}
                {set.tags?.includes('custom') && ` • ${i18n.labels.custom}`}
              </div>
            </div>
          );
        })}
        
        {/* Add new icon set button */}
        <div className="mk-icon-set-card mk-icon-set-add" onClick={addIconSetFromFolder}>
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
          <h4>{i18n.labels.iconsIn.replace('${1}', iconSets.find(s => s.id === selectedSet)?.name || '')}</h4>
          <div className="mk-icon-grid">
            {iconsList.slice(0, 100).map((icon, index) => {
              const iconName = typeof icon === 'string' ? icon : icon.id || icon.name;
              
              if (selectedSet === 'emoji') {
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
                      __html: stickerContent || superstate.ui.getSticker(`lucide//help-circle`),
                    }}
                  />
                  <div className="mk-icon-label">{iconName}</div>
                </div>
              );
            })}
          </div>
          {iconsList.length > 100 && (
            <div className="mk-icon-browser-note">
              {i18n.labels.showingFirst.replace('${1}', '100').replace('${2}', String(iconsList.length))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const IconSettings = ({ superstate }: SettingsProps) => {
  const { debouncedSave, immediateSave } = useDebouncedSave(superstate);
  const [spacesStickers, setSpacesStickers] = useState(Boolean(superstate.settings.spacesStickers));
  const [indexSVG, setIndexSVG] = useState(Boolean(superstate.settings.indexSVG));
  
  // Sync state with superstate.settings when component mounts or settings change
  useEffect(() => {
    setSpacesStickers(Boolean(superstate.settings.spacesStickers));
    setIndexSVG(Boolean(superstate.settings.indexSVG));
  }, [superstate.settings]);

  return (
    <div className="mk-setting-section">
      <h2>{i18n.labels.stickers}</h2>
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