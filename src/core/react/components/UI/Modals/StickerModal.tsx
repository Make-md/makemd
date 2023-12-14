import { Sticker, UIManager } from "core/middleware/ui";
import { i18n } from "makemd-core";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { emojiFromString } from "utils/stickers";

interface StickerModalProps {
  ui: UIManager;
  selectedSticker: (path: string) => void;
  hide: () => void;
}

const StickerModal: React.FC<StickerModalProps> = (props) => {
  const [query, setQuery] = useState("");
  const [allStickers, setAllStickers] = useState<Sticker[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<number>(null);

  const htmlFromSticker = (sticker: Sticker) => {
    if (sticker.type == "emoji") {
      return emojiFromString(sticker.html);
    }
    return sticker.html;
  };

  useEffect(() => {
    const _allImages: Sticker[] = [];
    _allImages.push(...props.ui.allStickers());
    setAllStickers(_allImages);
  }, []);

  const categories = useMemo(
    () => new Set(allStickers.map((f) => f.type)),
    [allStickers]
  );

  const [page, setPage] = useState(1);

  const loadNextPage = useCallback(() => {
    setPage((p) => p + 1);
  }, [page]);
  const loaderRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting) {
        loadNextPage();
      }
    });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [loadNextPage]);
  const [selectedCategory, setSelectedCategory] = useState<string>(null);
  useEffect(() => {
    setStickers(
      allStickers
        .filter(
          (f) =>
            f.name.includes(query) &&
            (selectedCategory == null || f.type == selectedCategory)
        )
        .slice(0, page * 250)
    );
  }, [query, allStickers, page, selectedCategory]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = selectedSticker;

    if (event.key === "ArrowUp" && currentIndex > 0) {
      setSelectedSticker(currentIndex - 1);
    } else if (
      event.key === "ArrowDown" &&
      currentIndex < stickers.length - 1
    ) {
      setSelectedSticker(currentIndex + 1);
    } else if (event.key === "Enter") {
      props.selectedSticker(
        stickers[selectedSticker].type + "//" + stickers[selectedSticker].value
      );
      props.hide();
    }
  };

  return (
    <>
      <input
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={i18n.labels.findStickers}
        className="mk-input mk-input-large mk-border-bottom"
      />
      <div className="mk-options-menu-sections">
        <div
          onClick={() => setSelectedCategory(null)}
          className={`${
            selectedCategory == null ? "is-active" : ""
          } mk-options-menu-section`}
        >
          All
        </div>

        {[...categories].map((f) => (
          <div
            key={f}
            onClick={() => setSelectedCategory(f)}
            className={`${
              selectedCategory == f ? "is-active" : ""
            } mk-options-menu-section`}
          >
            {f}
          </div>
        ))}
      </div>
      <div className="mk-layout-row mk-layout-wrap mk-gap-4 mk-padding-12 mk-layout-scroll">
        {stickers.map((icon, i) => (
          <div
            key={i}
            onClick={() => {
              props.selectedSticker(
                stickers[i].type + "//" + stickers[i].value
              );
              props.hide();
            }}
            className={
              selectedSticker === i
                ? "selected mk-padding-4 mk-border-radius-4 mk-hover"
                : "mk-padding-4 mk-border-radius-4 mk-hover"
            }
          >
            <div
              dangerouslySetInnerHTML={{ __html: htmlFromSticker(icon) }}
              className={"mk-sticker"}
            />
          </div>
        ))}
        <div ref={loaderRef}></div>
      </div>
    </>
  );
};

export default StickerModal;
