const driveRegex1 = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
const driveRegex2 = /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/;
const driveRegex3 = /https:\/\/drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/;

function convert(url) {
  let match = url.match(driveRegex1) || url.match(driveRegex2) || url.match(driveRegex3);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
}

console.log(convert("https://drive.google.com/file/d/1ExU6MyZjoOd2Majlb0yStoXT5cPvKka1/view?usp=drive_link"));
console.log(convert("https://drive.google.com/open?id=1ExU6MyZjoOd2Majlb0yStoXT5cPvKka1"));
