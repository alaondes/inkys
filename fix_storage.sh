#!/bin/bash
sed -i 's/localStorage.getItem('\''inkys_seeded'\'') !== '\''true'\''/(() => { try { return localStorage.getItem('\''inkys_seeded'\'') !== '\''true'\''; } catch(e) { return true; } })()/g' src/context/ProductContext.tsx

sed -i 's/localStorage.setItem('\''inkys_seeded'\'', '\''true'\'')/try { localStorage.setItem('\''inkys_seeded'\'', '\''true'\''); } catch(e) {}/g' src/context/ProductContext.tsx

sed -i 's/localStorage.getItem('\''inkys_settings_seeded'\'') !== '\''true'\''/(() => { try { return localStorage.getItem('\''inkys_settings_seeded'\'') !== '\''true'\''; } catch(e) { return true; } })()/g' src/context/SettingsContext.tsx

sed -i 's/localStorage.setItem('\''inkys_settings_seeded'\'', '\''true'\'')/try { localStorage.setItem('\''inkys_settings_seeded'\'', '\''true'\''); } catch(e) {}/g' src/context/SettingsContext.tsx
