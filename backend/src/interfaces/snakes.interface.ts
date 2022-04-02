export interface SnakeUrl {
  url: string;
}

export interface SnakeAsset {
  id: string;
  attrs: string[];
  schemas: string[];
}

export interface SnakeAssets {
  patterns: string[];
  snakes: SnakeAsset[];
}
