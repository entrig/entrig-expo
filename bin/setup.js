#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);

if (args.length === 0 || args[0] !== "ios") {
  console.log("Usage: npx entrig setup ios");
  process.exit(1);
}

console.log("🔧 Entrig iOS Setup\n");

// Find iOS directory
const iosDir = path.join(process.cwd(), "ios");
if (!fs.existsSync(iosDir)) {
  console.log("❌ Error: ios/ directory not found");
  console.log("   Make sure you run this from your Expo project root.");
  console.log('   Run "npx expo prebuild" first if you haven\'t.');
  process.exit(1);
}

// Find the app name from app.json
let appName = null;
const appJsonPath = path.join(process.cwd(), "app.json");
if (fs.existsSync(appJsonPath)) {
  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
    appName = appJson.expo?.name || appJson.name;
  } catch (e) {
    // ignore
  }
}

// Try to find the app directory in ios/
if (!appName) {
  const iosDirs = fs.readdirSync(iosDir).filter((f) => {
    const stat = fs.statSync(path.join(iosDir, f));
    return stat.isDirectory() && !f.startsWith(".") && f !== "Pods" && f !== "build";
  });
  if (iosDirs.length > 0) {
    appName = iosDirs[0];
  }
}

if (!appName) {
  console.log("❌ Error: Could not determine app name");
  process.exit(1);
}

console.log(`✅ Found iOS project: ${appName}\n`);

// Update entitlements
updateEntitlements(iosDir, appName);

// Update Info.plist
updateInfoPlist(iosDir, appName);

console.log("\n🎉 Setup complete! Rebuild your iOS app to apply changes.\n");

function updateEntitlements(iosDir, appName) {
  // Try common entitlements paths
  const possiblePaths = [
    path.join(iosDir, appName, `${appName}.entitlements`),
    path.join(iosDir, appName, `${appName.replace(/\s/g, "")}.entitlements`),
  ];

  let entitlementsPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      entitlementsPath = p;
      break;
    }
  }

  // If no entitlements file exists, create one
  if (!entitlementsPath) {
    entitlementsPath = path.join(iosDir, appName, `${appName}.entitlements`);
    const dir = path.dirname(entitlementsPath);

    if (!fs.existsSync(dir)) {
      console.log(`❌ Error: ${dir} not found`);
      return;
    }

    const defaultEntitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>aps-environment</key>
\t<string>development</string>
</dict>
</plist>`;

    fs.writeFileSync(entitlementsPath, defaultEntitlements);
    console.log(`📝 Created: ${path.relative(process.cwd(), entitlementsPath)}`);
    console.log("✅ Added aps-environment to entitlements");

    // Remind user to add entitlements to Xcode
    console.log("\n⚠️  Note: You may need to add the entitlements file to your Xcode project:");
    console.log(`   1. Open ${appName}.xcworkspace in Xcode`);
    console.log(`   2. Select your target > Signing & Capabilities`);
    console.log("   3. Click + Capability > Push Notifications");
    return;
  }

  console.log(`📝 Checking ${path.relative(process.cwd(), entitlementsPath)}...`);

  let content = fs.readFileSync(entitlementsPath, "utf8");

  // Check if aps-environment already exists
  if (content.includes("aps-environment")) {
    console.log("✅ aps-environment already configured");
    return;
  }

  // Backup
  const backupPath = entitlementsPath + ".backup";
  fs.copyFileSync(entitlementsPath, backupPath);
  console.log(`💾 Backup created: ${path.relative(process.cwd(), backupPath)}`);

  const apsEntry = `\t<key>aps-environment</key>\n\t<string>development</string>\n`;

  // Handle self-closing <dict/> tag
  if (content.includes("<dict/>")) {
    content = content.replace("<dict/>", `<dict>\n${apsEntry}</dict>`);
  } else {
    // Add aps-environment before closing </dict>
    const insertPoint = content.lastIndexOf("</dict>");
    if (insertPoint === -1) {
      console.log("❌ Error: Could not parse entitlements file");
      return;
    }
    content = content.slice(0, insertPoint) + apsEntry + content.slice(insertPoint);
  }

  fs.writeFileSync(entitlementsPath, content);
  console.log("✅ Added aps-environment to entitlements");
}

function updateInfoPlist(iosDir, appName) {
  const infoPlistPath = path.join(iosDir, appName, "Info.plist");

  if (!fs.existsSync(infoPlistPath)) {
    console.log(`⚠️  Warning: ${path.relative(process.cwd(), infoPlistPath)} not found`);
    return;
  }

  console.log(`📝 Checking ${path.relative(process.cwd(), infoPlistPath)}...`);

  let content = fs.readFileSync(infoPlistPath, "utf8");

  // Check if UIBackgroundModes with remote-notification already exists
  if (content.includes("UIBackgroundModes") && content.includes("remote-notification")) {
    console.log("✅ UIBackgroundModes already configured");
    return;
  }

  // Backup
  const backupPath = infoPlistPath + ".backup";
  fs.copyFileSync(infoPlistPath, backupPath);
  console.log(`💾 Backup created: ${path.relative(process.cwd(), backupPath)}`);

  if (content.includes("UIBackgroundModes")) {
    // Add remote-notification to existing array
    const arrayMatch = content.match(/<key>UIBackgroundModes<\/key>\s*<array>/);
    if (arrayMatch) {
      const insertPoint = arrayMatch.index + arrayMatch[0].length;
      const newEntry = "\n\t\t<string>remote-notification</string>";
      content = content.slice(0, insertPoint) + newEntry + content.slice(insertPoint);
    }
  } else {
    // Add UIBackgroundModes array before closing </dict>
    // Find the main dict's closing tag (last </dict> before </plist>)
    const plistEnd = content.lastIndexOf("</plist>");
    const dictEnd = content.lastIndexOf("</dict>", plistEnd);

    if (dictEnd === -1) {
      console.log("❌ Error: Could not parse Info.plist");
      return;
    }

    const bgModes = `\t<key>UIBackgroundModes</key>\n\t<array>\n\t\t<string>remote-notification</string>\n\t</array>\n`;
    content = content.slice(0, dictEnd) + bgModes + content.slice(dictEnd);
  }

  fs.writeFileSync(infoPlistPath, content);
  console.log("✅ Added remote-notification to UIBackgroundModes");
}
