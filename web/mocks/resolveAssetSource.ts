export default function resolveAssetSource(source: any) {
  if (typeof source === "string") {
    return { uri: source };
  }
  return source;
}
