const fs = require('fs');
let content = fs.readFileSync('src/context/SettingsContext.tsx', 'utf8');

const targetStr = `    try {
      await setDoc(settingsRef, newSettings, { merge: true });
    } catch (error) {
      console.warn('Failed to update settings in Firestore, but updated locally:', error);
    }`;

const replacementStr = `    try {
      await Promise.race([
        setDoc(settingsRef, newSettings, { merge: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout ao salvar: A imagem pode ser muito grande (limite de 1MB).')), 12000))
      ]);
    } catch (error) {
      console.warn('Failed to update settings in Firestore, but updated locally:', error);
      throw error;
    }`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('src/context/SettingsContext.tsx', content);
console.log('Fixed SettingsContext');
