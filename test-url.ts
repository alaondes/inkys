import { convertGoogleDriveUrl } from './src/lib/urlUtils.js';

const url = "https://drive.google.com/file/d/1ExU6MyZjoOd2Majlb0yStoXT5cPvKka1/view?usp=drive_link";
console.log(convertGoogleDriveUrl(url));
