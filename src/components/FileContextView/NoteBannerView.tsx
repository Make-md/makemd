import { imageModal } from "components/ui/modals/imageModal";
import { isMouseEvent } from "hooks/useLongPress";
import i18n from "i18n";
import MakeMDPlugin from "main";
import { Menu, TAbstractFile, TFile } from "obsidian";
import React, { useEffect, useState } from "react";
import { getAbstractFileAtPath } from "utils/file";
import {
  deleteFrontmatterValue,
  saveFrontmatterValue,
} from "utils/metadata/frontmatter/fm";

export const NoteBannerView = (props: {
  plugin: MakeMDPlugin;
  link: string;
  file?: TAbstractFile;
}) => {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    if (props.link) {
      const newBanner = getAbstractFileAtPath(app, props.link) ?? props.link;
      setBanner(newBanner);
    } else {
      setBanner(null);
    }
  }, [props.link]);
  const triggerBannerContextMenu = (e: React.MouseEvent) => {
    if (!props.file) return;
    e.preventDefault();
    const fileMenu = new Menu();

    fileMenu.addSeparator();
    // Rename Item
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle(i18n.buttons.changeBanner);
      menuItem.setIcon("lucide-image");
      menuItem.onClick((ev: MouseEvent) => {
        let vaultChangeModal = new imageModal(
          props.plugin,
          props.plugin.app,
          (image) =>
            saveFrontmatterValue(
              props.plugin,
              props.file.path,
              props.plugin.settings.fmKeyBanner,
              image,
              "image",
              true
            )
        );
        vaultChangeModal.open();
      });
    });

    fileMenu.addItem((menuItem) => {
      menuItem.setTitle(i18n.buttons.removeBanner);
      menuItem.setIcon("lucide-file-minus");
      menuItem.onClick((ev: MouseEvent) => {
        deleteFrontmatterValue(
          props.plugin,
          props.file.path,
          props.plugin.settings.fmKeyBanner
        );
      });
    });

    if (isMouseEvent(e)) {
      fileMenu.showAtPosition({ x: e.pageX, y: e.pageY });
    } else {
      fileMenu.showAtPosition({
        // @ts-ignore
        x: e.nativeEvent.locationX,
        // @ts-ignore
        y: e.nativeEvent.locationY,
      });
    }
    return false;
  };
  return (
    <div className={`mk-note-header`} onContextMenu={triggerBannerContextMenu}>
      {banner && (
        <img
          src={
            banner instanceof TFile ? app.vault.getResourcePath(banner) : banner
          }
        />
      )}
    </div>
  );
};
