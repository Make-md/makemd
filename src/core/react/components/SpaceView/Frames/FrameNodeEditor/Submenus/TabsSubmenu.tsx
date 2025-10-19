import { defaultMenu } from "core/react/components/UI/Menus/menu/SelectionMenu";
import { SelectOptionType, Superstate } from "makemd-core";
import i18n from "shared/i18n";
import React, { useEffect, useState } from "react";
import { FrameNodeState } from "shared/types/frameExec";
import { FrameNode } from "shared/types/mframe";
import { SpaceTableSchema } from "shared/types/mdb";
import { SelectOption } from "shared/types/menu";
import { windowFromDocument } from "shared/utils/dom";

interface Tab {
  name: string;
  view: string;
}

interface TabsSubmenuProps {
  superstate: Superstate;
  node: FrameNode;
  state: FrameNodeState;
  path: string;
  updateNode: (node: FrameNode, props: Partial<FrameNode>) => void;
}

export const TabsSubmenu: React.FC<TabsSubmenuProps> = ({
  superstate,
  node,
  state,
  path,
  updateNode,
}) => {
  const [newTabName, setNewTabName] = useState("");
  const [availableFrames, setAvailableFrames] = useState<SpaceTableSchema[]>(
    []
  );
  const [editingTabs, setEditingTabs] = useState<{ [key: number]: string }>({});
  const [localTabs, setLocalTabs] = useState<Tab[]>([]);

  useEffect(() => {
    if (path) {
      superstate.spaceManager.framesForSpace(path).then((frames) => {
        setAvailableFrames(frames.filter((f) => f.id != "main") || []);
      });
    }
  }, [path, superstate]);

  const currentTabs: Tab[] = React.useMemo(() => {
    try {
      // Check both state.props and node.props
      const tabsValue = state?.props?.tabs || node.props?.tabs;
      if (typeof tabsValue === "string") {
        return JSON.parse(tabsValue);
      }
      return tabsValue || [];
    } catch {
      return [];
    }
  }, [state?.props?.tabs, node.props?.tabs]);

  // Sync local tabs with current tabs
  useEffect(() => {
    setLocalTabs(currentTabs);
  }, [currentTabs]);

  const updateTabs = (tabs: Tab[]) => {
    setLocalTabs(tabs); // Update local state immediately
    updateNode(node, {
      props: {
        ...node.props,
        tabs: JSON.stringify(tabs),
      },
    });
  };

  const addTab = () => {
    if (!newTabName.trim()) return;

    const newTab: Tab = {
      name: newTabName.trim(),
      view: "",
    };

    const updatedTabs = [...localTabs, newTab];
    updateTabs(updatedTabs);
    setNewTabName("");
  };

  const removeTab = (index: number) => {
    if (localTabs.length <= 1) return; // Keep at least one tab

    const updatedTabs = localTabs.filter((_, i) => i !== index);
    updateTabs(updatedTabs);

    // Update currentTab if necessary
    const currentTabIndex = parseInt(
      state?.props?.currentTab || node.props?.currentTab || "0"
    );
    if (currentTabIndex >= updatedTabs.length) {
      setLocalTabs(updatedTabs); // Update local state immediately
      updateNode(node, {
        props: {
          ...node.props,
          currentTab: (updatedTabs.length - 1).toString(),
          tabs: JSON.stringify(updatedTabs),
        },
      });
    } else if (currentTabIndex > index) {
      setLocalTabs(updatedTabs); // Update local state immediately
      updateNode(node, {
        props: {
          ...node.props,
          currentTab: (currentTabIndex - 1).toString(),
          tabs: JSON.stringify(updatedTabs),
        },
      });
    }
  };

  const updateTabName = (index: number, name: string) => {
    const updatedTabs = localTabs.map((tab, i) =>
      i === index ? { ...tab, name } : tab
    );
    updateTabs(updatedTabs);
  };

  const updateTabView = (index: number, view: string) => {
    const updatedTabs = localTabs.map((tab, i) =>
      i === index ? { ...tab, view } : tab
    );
    updateTabs(updatedTabs);
  };

  const showFrameSelectMenu = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const options: SelectOption[] = availableFrames.map((frame) => ({
      name: frame.name,
      value: frame.id,
      icon: frame.type === "frame" ? "ui//frame" : "ui//table",
      onClick: () => {
        updateTabView(index, `./#*${frame.id}`);
      },
    }));

    if (options.length === 0) {
      options.push({
        name: i18n.menu.noFramesAvailable,
        type: SelectOptionType.Option,
        disabled: true,
      });
    }

    const menuProps = {
      ...defaultMenu(superstate.ui, options),
      searchable: true,
    };

    superstate.ui.openMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      menuProps,
      windowFromDocument(e.view.document)
    );
  };

  return (
    <div
      className="mk-frame-editor-tabs-submenu"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
    >
      <div className="mk-frame-editor-tabs-list">
        {localTabs.map((tab, index) => (
          <div key={index} className="mk-frame-editor-tab-item">
            <div
              className="mk-frame-editor-tab-controls"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <input
                type="text"
                value={
                  editingTabs[index] !== undefined
                    ? editingTabs[index]
                    : tab.name || ""
                }
                onChange={(e) => {
                  e.stopPropagation();
                  setEditingTabs((prev) => ({
                    ...prev,
                    [index]: e.target.value,
                  }));
                }}
                onFocus={(e) => {
                  e.stopPropagation();
                  setEditingTabs((prev) => ({
                    ...prev,
                    [index]: tab.name || "",
                  }));
                }}
                onBlur={(e) => {
                  e.stopPropagation();
                  const newValue = editingTabs[index];
                  if (newValue !== undefined && newValue !== tab.name) {
                    updateTabName(index, newValue);
                  }
                  setEditingTabs((prev) => {
                    const next = { ...prev };
                    delete next[index];
                    return next;
                  });
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    e.preventDefault();
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                placeholder={i18n.menu.tabName}
                className="mk-frame-editor-tab-name-input"
              />
              <div
                className="mk-cell-option-item"
                onClick={(e) => showFrameSelectMenu(e, index)}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {(() => {
                  // Extract frame ID from formats like "./#*frameId" or just "frameId"
                  const frameId = tab.view?.startsWith("./#*")
                    ? tab.view.substring(4)
                    : tab.view;
                  const selectedFrame = availableFrames.find(
                    (f) => f.id === frameId
                  );
                  return selectedFrame
                    ? selectedFrame.name
                    : frameId || "Select view...";
                })()}
                <div
                  className="mk-cell-option-select mk-icon-xxsmall mk-icon-rotated"
                  dangerouslySetInnerHTML={{
                    __html: superstate.ui.getSticker("ui//collapse-solid"),
                  }}
                />
              </div>
              {localTabs.length > 1 && (
                <button
                  onClick={() => removeTab(index)}
                  className="mk-inline-button"
                  title={i18n.menu.removeTab}
                  dangerouslySetInnerHTML={{
                    __html: superstate.ui.getSticker("ui//close"),
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mk-frame-editor-add-tab">
        <input
          type="text"
          value={newTabName}
          onChange={(e) => {
            e.stopPropagation();
            setNewTabName(e.target.value);
          }}
          placeholder="+ New Tab"
          className="mk-frame-editor-new-tab-input"
          style={{ outline: "none" }}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              e.preventDefault();
              addTab();
            }
          }}
        />
      </div>
    </div>
  );
};
