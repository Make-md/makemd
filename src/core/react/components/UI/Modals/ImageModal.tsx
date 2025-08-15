import { Superstate } from "makemd-core";
import React, { useEffect, useRef, useState } from "react";
import { urlRegex } from "utils/regex";

interface ImageModalProps {
  superstate: Superstate;
  selectedPath: (path: string) => void;
  hide?: () => void;
}

export type ImagePreview = {
  path: string;
  thumnail: string;
};

const ImageModal: React.FC<ImageModalProps> = (props) => {
  const [query, setQuery] = useState("");
  const [allImages, setAllImages] = useState<ImagePreview[]>([]);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const _allImages: ImagePreview[] = [];
    
    // Add asset manager cover images first (to display at top)
    const assetManager = (props.superstate as any).assets;
    if (assetManager && assetManager.getAllCoverImages) {
      const coverImages = assetManager.getAllCoverImages();
      _allImages.push(
        ...coverImages.map((coverImage: any) => ({
          path: coverImage.url,
          thumnail: coverImage.url,
        }))
      );
    }
    
    // Add existing images from pathsIndex
    _allImages.push(
      ...[...props.superstate.pathsIndex.values()]
        .filter((f) => f.subtype == "image")
        .sort((a, b) => {
          return +b.metadata?.ctime - +a.metadata?.ctime;
        })
        .map((f) => ({ path: f.path, thumnail: f.label.thumbnail }))
    );
    setAllImages(_allImages);
    setImages(_allImages);
  }, []);

  useEffect(() => {
    query.match(urlRegex)
      ? setImages([{ path: query, thumnail: query }])
      : setImages(allImages.filter((f) => f.path.includes(query)));
  }, [query, allImages]);
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = images.findIndex((f) => f.path == selectedImage);

    if (event.key === "ArrowUp" && currentIndex > 0) {
      setSelectedImage(images[currentIndex - 1].path);
    } else if (event.key === "ArrowDown" && currentIndex < images.length - 1) {
      setSelectedImage(images[currentIndex + 1].path);
    } else if (event.key === "Enter") {
      props.selectedPath(selectedImage);
      props.hide();
    }
  };

  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, [ref.current]);

  return (
    <>
      <input
        onKeyDown={handleKeyDown}
        value={query}
        ref={ref}
        onChange={handleInputChange}
        className="mk-input mk-input-large mk-border-bottom"
      />
      <div className="mk-layout-masonry mk-padding-12 mk-layout-scroll">
        {images.map((image) => (
          <img
            key={image.path}
            src={props.superstate.ui.getUIPath(image.thumnail)}
            className={selectedImage === image.path ? "mk-selected" : ""}
            onClick={() => {
              props.selectedPath(image.path);
              props.hide();
            }}
          />
        ))}
      </div>
    </>
  );
};

export default ImageModal;
