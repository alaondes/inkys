const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Settings.tsx', 'utf8');

// Replace shallow object mutations with spread operations
code = code.replace(/newBanners\[index\]\.image = res;/g, 'newBanners[index] = { ...newBanners[index], image: res };');
code = code.replace(/newBanners\[index\]\.image = e\.target\.value;/g, 'newBanners[index] = { ...newBanners[index], image: e.target.value };');
code = code.replace(/newBanners\[index\]\.titleHtml = e\.target\.value;/g, 'newBanners[index] = { ...newBanners[index], titleHtml: e.target.value };');
code = code.replace(/newBanners\[index\]\.subtitle = e\.target\.value;/g, 'newBanners[index] = { ...newBanners[index], subtitle: e.target.value };');
code = code.replace(/newBanners\[index\]\.buttonText = e\.target\.value;/g, 'newBanners[index] = { ...newBanners[index], buttonText: e.target.value };');
code = code.replace(/newBanners\[index\]\.buttonColor = e\.target\.value;/g, 'newBanners[index] = { ...newBanners[index], buttonColor: e.target.value };');

// Increase compression aggressively to avoid Firestore size limits
code = code.replace(/canvas\.toDataURL\(outputType, outputType === 'image\/jpeg' \? 0\.8 : undefined\)/g, "canvas.toDataURL('image/jpeg', 0.5)");

// Just to be sure the base64 doesn't get excessively large, we can set max width/height to smaller values for banners
code = code.replace(/resizeImage\(file, 1920, 1080\)/g, "resizeImage(file, 1200, 675)"); // Still 16:9 ratio, but much smaller

fs.writeFileSync('src/admin/views/Settings.tsx', code);
console.log("Fixed mutations and compression");
