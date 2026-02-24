export const FORMAT_OPTIONS = ['Ring', 'Heads up'] as const;
export type FormatOption = (typeof FORMAT_OPTIONS)[number];

export const ORIGIN_OPTIONS = ['WPT Gold', 'Live'] as const;
export type OriginOption = (typeof ORIGIN_OPTIONS)[number];
