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
  const [pathWithoutHash, hash = ''] = normalizedPath.split('#');
  const [pathname, query = ''] = pathWithoutHash.split('?');

  let normalizedPathname = pathname;
  const looksLikeAsset = /\.[a-zA-Z0-9]+$/.test(pathname);

  if (!looksLikeAsset && pathname !== '/' && !pathname.endsWith('/')) {
    normalizedPathname = `${pathname}/`;
  }

  const rebuiltPath = `${normalizedPathname}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;

  if (!basePath) {
    return rebuiltPath;
  }

  if (rebuiltPath === basePath || rebuiltPath.startsWith(`${basePath}/`)) {
    return rebuiltPath;
  }

  return `${basePath}${rebuiltPath}`.replace(/\/{2,}/g, '/');
}
