function convertGoogleDriveUrl(url) {
  if (!url) return url;
  
  const driveRegex1 = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const driveRegex2 = /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/;
  const driveRegex3 = /https:\/\/drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/;

  const match = url.match(driveRegex1) || url.match(driveRegex2) || url.match(driveRegex3);
  
  if (match && match[1]) {
    const fileId = match[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  
  return url;
}

console.log(convertGoogleDriveUrl('https://drive.google.com/file/d/1B638AMwcC_ugR7ZT5Z--lOsjrdkMAxp8/view?usp=drive_link'));
