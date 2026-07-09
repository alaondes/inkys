const fs = require('fs');
let code = fs.readFileSync('src/admin/components/BannersTab.tsx', 'utf8');

const strStart = '<div className="mt-12 pt-8 border-t border-gray-200">';
const strEnd = '<button \n        type="button"\n        onClick={handleSaveStorefront}';

if (code.includes(strStart) && code.includes(strEnd)) {
  const startIdx = code.indexOf(strStart);
  const endIdx = code.indexOf(strEnd, startIdx);
  if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + code.substring(endIdx);
    fs.writeFileSync('src/admin/components/BannersTab.tsx', code);
    console.log("Removed from BannersTab");
  }
} else {
  console.log("Could not find delimiters");
  console.log("Start exists?", code.includes(strStart));
  console.log("End exists?", code.includes('<button \n        type="button"\n        onClick={handleSaveStorefront}'));
}
