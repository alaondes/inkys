export function convertGoogleDriveUrl(url: string): string {
  if (!url) return url;
  
  // match https://drive.google.com/file/d/ID/...
  const driveRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(driveRegex);
  
  if (match && match[1]) {
    const fileId = match[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  
  return url;
}
