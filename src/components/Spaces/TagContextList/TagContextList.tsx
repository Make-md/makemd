import MakeMDPlugin from "main";
import React, { useEffect, useState } from "react";
import { eventTypes } from "types/types";
import { loadTags } from "utils/contexts/contexts";
import {
  openTag
} from "utils/file";

export const TagContextList = (props: { plugin: MakeMDPlugin }) => {
  const [tags, setTags] = useState<string[]>([]);
  const openContext = async (tag: string) => {
    openTag(tag, props.plugin, false);
  };
  useEffect(() => {
    window.addEventListener(eventTypes.tagsChange, refreshTags);

    return () => {
      window.removeEventListener(eventTypes.tagsChange, refreshTags);
    };
  }, []);
  const refreshTags = () => {
    const f = loadTags(props.plugin);
    setTags(f);
  };

  useEffect(() => {
    refreshTags();
  }, []);
  return (
    <div className="tag-container">
      <div className="tree-item">
        {tags.map((f) => (
          <div
            className="tree-item-self is-clickable"
            onClick={() => openContext(f)}
          >
            {f}
          </div>
        ))}
      </div>
    </div>
  );
};
