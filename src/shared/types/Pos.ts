
export type Pos = { x: number; y: number; z?: number; };
export type Size = { width: number; height: number; };
export type Rect = { x: number; y: number; width: number; height: number; };

export type Anchors = "top" | "bottom" | "left" | "right" | 'center'
export type Edges = "top" | "bottom" | "left" | "right" | 'inside'