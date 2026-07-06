const fs = require('fs');
// Need a simple manual replacement

function replaceInFile(file, replacements) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  replacements.forEach(([from, to]) => {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  });
  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}

replaceInFile('src/admin/views/Customers.tsx', [
  ['src={settings.logoUrl}', 'src={settings.logoUrl || undefined}']
]);

replaceInFile('src/admin/views/Documents.tsx', [
  ['src={settings.logoUrl}', 'src={settings.logoUrl || undefined}']
]);

replaceInFile('src/admin/views/Orders.tsx', [
  ['src={settings.logoUrl}', 'src={settings.logoUrl || undefined}']
]);

replaceInFile('src/admin/views/Settings.tsx', [
  ['src={banner.image}', 'src={banner.image || undefined}'],
  ['new Image()', 'new window.Image()']
]);

replaceInFile('src/admin/AdminApp.tsx', [
  ['src={logoUrl}', 'src={logoUrl || undefined}']
]);

replaceInFile('src/storefront/Storefront.tsx', [
  ['src={logoUrl}', 'src={logoUrl || undefined}']
]);

replaceInFile('src/components/ProductCard.tsx', [
  ['src={images[currentImageIndex]}', 'src={images[currentImageIndex] || undefined}']
]);

