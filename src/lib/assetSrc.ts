export function assetSrc(asset: string | { src: string }): string {
  return typeof asset === "string" ? asset : asset.src;
}
