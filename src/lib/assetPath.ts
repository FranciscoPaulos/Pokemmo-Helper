export function assetPath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const basePath = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

  return `${basePath}${normalizedPath}`;
}
