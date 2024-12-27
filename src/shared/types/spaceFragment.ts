
export type SpaceFragmentType = "context" | 'frame' | 'action';

export type SpaceFragmentSchema = {
  id: string;
  name: string;
  sticker?: string;
  frameType?: string;
  type: SpaceFragmentType;
  path: string;
};
