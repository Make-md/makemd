import { Superstate } from "core/superstate/superstate";
import React, { useEffect, useState } from "react";
import { urlRegex } from "utils/regex";

interface ImageModalProps {
  superstate: Superstate;
  selectedPath: (path: string) => void;
  hide: () => void;
}

const ImageModal: React.FC<ImageModalProps> = (props) => {
  const [query, setQuery] = useState("");
  const [allImages, setAllImages] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const _allImages: string[] = [];
    _allImages.push(
      ...props.superstate.spaceManager.allPaths(["png", "jpg", "jpeg", "webp"])
    );
    setAllImages(_allImages);
    setImages(_allImages);
  }, []);

  useEffect(() => {
    query.match(urlRegex)
      ? setImages([query])
      : setImages(allImages.filter((f) => f.includes(query)).slice(0, 30));
  }, [query, allImages]);
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = images.indexOf(selectedImage);

    if (event.key === "ArrowUp" && currentIndex > 0) {
      setSelectedImage(images[currentIndex - 1]);
    } else if (event.key === "ArrowDown" && currentIndex < images.length - 1) {
      setSelectedImage(images[currentIndex + 1]);
    } else if (event.key === "Enter") {
      props.selectedPath(selectedImage);
      props.hide();
    }
  };

  return (
    <>
      <input
        onKeyDown={handleKeyDown}
        value={query}
        onChange={handleInputChange}
        className="mk-input mk-input-large mk-border-bottom"
      />
      <div className="mk-layout-masonry mk-padding-12 mk-layout-scroll">
        {images.map((image) => (
          <img
            key={image}
            src={props.superstate.ui.getUIPath(image)}
            className={selectedImage === image ? "mk-selected" : ""}
            onClick={() => {
              props.selectedPath(image);
              props.hide();
            }}
          />
        ))}
      </div>
    </>
  );
};

export default ImageModal;
