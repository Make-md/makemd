import { Superstate } from "makemd-core";
import i18n from "shared/i18n";
import React, { useState } from "react";
import { AdvancedSettings } from "./SettingsSections/AdvancedSettings";
import { CoverImageSettings } from "./SettingsSections/AppearanceSettings";
import { ColorPaletteSettings } from "./SettingsSections/ColorPaletteSettings";
import { GeneralSettings } from "./SettingsSections/GeneralSettings";
import { HiddenFilesSettings } from "./SettingsSections/HiddenFilesSettings";
import { IconSettings } from "./SettingsSections/IconSettings";
import { LanguageSettings } from "./SettingsSections/LanguageSettings";
import { NavigatorSettings } from "./SettingsSections/NavigatorSettings";
import { NotesSettings } from "./SettingsSections/NotesSettings";
import { PerformanceSettings } from "./SettingsSections/PerformanceSettings";
import { SpaceSettings } from "./SettingsSections/SpaceSettings";
import { SettingSection } from "./SettingsSections/types";

interface SettingsProps {
  superstate: Superstate;
}

export const Settings = ({ superstate }: SettingsProps) => {
  const [activeSection, setActiveSection] = useState("general");

  const sections: SettingSection[] = [
    // Core Settings
    {
      id: "general",
      name: i18n.settings.sections.general,
      icon: "ui//settings",
      component: GeneralSettings,
      category: "core",
    },
    {
      id: "navigator",
      name: i18n.settings.sections.navigator,
      icon: "ui//spaces",
      component: NavigatorSettings,
      category: "core",
    },
    {
      id: "space",
      name: i18n.settings.sections.space,
      icon: "ui//folder",
      component: SpaceSettings,
      category: "core",
    },
    {
      id: "notes",
      name: i18n.settings.sections.notes,
      icon: "ui//file-text",
      component: NotesSettings,
      category: "core",
    },
    // Appearance Settings

    {
      id: "colors",
      name: i18n.settings.sections.colors || "Colors",
      icon: "lucide//droplets",
      component: ColorPaletteSettings,
      category: "appearance",
    },
    {
      id: "icons",
      name: i18n.settings.sections.stickers || "Stickers",
      icon: "ui//image",
      component: IconSettings,
      category: "appearance",
    },
    {
      id: "appearance",
      name: i18n.settings.sections.coverImage,
      icon: "ui//palette",
      component: CoverImageSettings,
      category: "appearance",
    },
    // System Settings
    {
      id: "performance",
      name: i18n.settings.sections.performance,
      icon: "ui//zap",
      component: PerformanceSettings,
      category: "system",
    },
    {
      id: "hidden",
      name: i18n.settings.sections.hidden || "Hidden Files",
      icon: "ui//eye-off",
      component: HiddenFilesSettings,
      category: "system",
    },
    {
      id: "language",
      name: i18n.settings.sections.language || i18n.settings.language,
      icon: "lucide//globe",
      component: LanguageSettings,
      category: "system",
    },
    {
      id: "advanced",
      name: i18n.settings.sections.advanced,
      icon: "lucide//settings-2",
      component: AdvancedSettings,
      category: "system",
    },
  ];

  const currentSection = sections.find(
    (section) => section.id === activeSection
  );
  const CurrentComponent = currentSection?.component;

  const categories = [
    {
      id: "core",
      name: i18n.settings.categories.core,
      sections: sections.filter((s) => s.category === "core"),
    },
    {
      id: "appearance",
      name: i18n.settings.categories.appearance,
      sections: sections.filter((s) => s.category === "appearance"),
    },
    {
      id: "system",
      name: i18n.settings.categories.system,
      sections: sections.filter((s) => s.category === "system"),
    },
  ];

  return (
    <div className="mk-settings-container">
      <div className="mk-settings-sidebar">
        <div className="mk-settings-nav">
          {categories.map((category) => (
            <React.Fragment key={category.id}>
              <div className="mk-settings-category-header">{category.name}</div>
              {category.sections.map((section) => (
                <button
                  key={section.id}
                  className={`mk-settings-nav-item ${
                    activeSection === section.id ? "mk-active" : ""
                  }`}
                  data-category={section.category}
                  onClick={() => setActiveSection(section.id)}
                >
                  <div
                    className="mk-icon-small"
                    dangerouslySetInnerHTML={{
                      __html: superstate.ui.getSticker(section.icon),
                    }}
                    style={{ color: "var(--mk-ui-text-primary" }}
                  ></div>
                  <span>{section.name}</span>
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="mk-settings-content">
        <div className="mk-settings-content-inner">
          {CurrentComponent && <CurrentComponent superstate={superstate} />}
        </div>
      </div>
    </div>
  );
};
