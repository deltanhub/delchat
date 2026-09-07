const fs = require('fs');
const path = require('path');

/**
 * Patch script to ensure expo-notifications does not throw a fatal uncaught
 * exception when running in Android Expo Go (SDK 53+).
 *
 * It softens the fatal throw in warnOfExpoGoPushUsage to a non-blocking console.warn.
 */
function patchWarnOfExpoGoPushUsage() {
  const targetFiles = [
    path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build', 'warnOfExpoGoPushUsage.js'),
    path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'src', 'warnOfExpoGoPushUsage.ts'),
  ];

  let patchedAny = false;

  for (const filePath of targetFiles) {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('throw new Error(message);')) {
        content = content.replace('throw new Error(message);', 'console.warn(message);');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[patch-expo-notifications] Successfully patched: ${filePath}`);
        patchedAny = true;
      } else if (content.includes('console.warn(message);')) {
        console.log(`[patch-expo-notifications] File already patched: ${filePath}`);
        patchedAny = true;
      }
    }
  }

  if (!patchedAny) {
    console.log('[patch-expo-notifications] No target files found to patch (node_modules might not be installed yet).');
  }
}

patchWarnOfExpoGoPushUsage();
