import { Superstate } from "makemd-core";
import React from "react";

type ImageSet = {
  name: string;
};

export const ImageSet = (props: { superstate: Superstate }) => {
  const [images, setImages] = React.useState<ImageSet[]>([]);
  const [currentSet, setCurrentSet] = React.useState<ImageSet | null>(null);
  const addImage = (image: ImageSet) => {
    setImages([...images, image]);
  };
  return <div></div>;
};
