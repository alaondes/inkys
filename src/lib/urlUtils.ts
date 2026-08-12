export function convertGoogleDriveUrl(url: string | undefined | null): string {
  if (!url) return url as any;
  const driveRegex1 = /https?:\/\/(?:drive|docs)\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([_a-zA-Z0-9-]+)/;
  const match = url.match(driveRegex1);
  if (match && match[1]) {
    const fileId = match[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return url;
}
