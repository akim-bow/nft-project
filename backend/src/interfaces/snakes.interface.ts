export interface SnakeUrl {
  url: string;
}

export interface SnakeAsset {
  id: string;
  attrs: string[];
  schemas: string[];
}

export interface SnakeAssets {
  arenas: string[];
  patterns: string[];
  snakes: SnakeAsset[];
}

export interface SnakeMetadata {
  mask: boolean;
  schemas: {
    [schema: string]: string[];
  };
  attrSets: string[];
}
