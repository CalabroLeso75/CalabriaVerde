const RAW_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function getAppBasePath() {
  if (!RAW_BASE_PATH || RAW_BASE_PATH === '/') {
    return '';
  }

  return RAW_BASE_PATH.endsWith('/') ? RAW_BASE_PATH.slice(0, -1) : RAW_BASE_PATH;
}

export function withAppBasePath(path: string) {
  const basePath = getAppBasePath();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!basePath) {
    return normalizedPath;
  }

  if (normalizedPath === basePath || normalizedPath.startsWith(`${basePath}/`)) {
    return normalizedPath;
  }

  return `${basePath}${normalizedPath}`.replace(/\/{2,}/g, '/');
}
