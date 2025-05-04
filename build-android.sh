#!/bin/bash
set -e

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== PantryPal Android Build Script ===${NC}"

# Ensure we have the right environment
if [ ! -f "capacitor.config.ts" ]; then
  echo -e "${RED}Error: capacitor.config.ts not found. Make sure you're in the project root.${NC}"
  exit 1
fi

# Check for required dependencies
if ! command -v npm &> /dev/null; then
  echo -e "${RED}Error: npm is not installed.${NC}"
  exit 1
fi

echo -e "${BLUE}Step 1/6: Installing dependencies${NC}"
npm install

echo -e "${BLUE}Step 2/6: Building the web application${NC}"
npm run build

echo -e "${BLUE}Step 3/6: Syncing assets with Capacitor${NC}"
npx cap sync

echo -e "${BLUE}Step 4/6: Updating Android project with the latest changes${NC}"
npx cap update android

echo -e "${BLUE}Step 5/6: Copying Android resources${NC}"
if [ -d "android-resources" ]; then
  echo "Copying strings.xml..."
  cp -f android-resources/strings.xml android/app/src/main/res/values/strings.xml 2>/dev/null || echo "strings.xml not found or cannot be copied"
  
  echo "Copying shortcuts.xml..."
  mkdir -p android/app/src/main/res/xml
  cp -f android-resources/shortcuts.xml android/app/src/main/res/xml/shortcuts.xml 2>/dev/null || echo "shortcuts.xml not found or cannot be copied"
  
  # Copy drawable resources if they exist
  if [ -d "android-resources/drawable" ]; then
    echo "Copying drawable resources..."
    mkdir -p android/app/src/main/res/drawable
    cp -rf android-resources/drawable/* android/app/src/main/res/drawable/ 2>/dev/null || echo "No drawable resources found or cannot be copied"
  fi
else
  echo "android-resources directory not found, skipping resource copying"
fi

echo -e "${BLUE}Step 6/6: Ready to build the Android app${NC}"
echo -e "${GREEN}Build completed successfully!${NC}"
echo ""
echo -e "To open Android Studio and build the APK/Bundle:"
echo -e "  ${GREEN}npx cap open android${NC}"
echo ""
echo -e "For a debug build directly from the command line:"
echo -e "  ${GREEN}cd android && ./gradlew assembleDebug${NC}"
echo ""
echo -e "For a release build directly from the command line:"
echo -e "  ${GREEN}cd android && ./gradlew assembleRelease${NC}"
echo ""
echo -e "${BLUE}Note:${NC} For release builds, make sure to set up signing keys in android/app/build.gradle"