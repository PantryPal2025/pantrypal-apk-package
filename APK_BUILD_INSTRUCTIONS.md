# Building PantryPal APK Using External Services

Since this environment doesn't have the Java Development Kit (JDK) and Android SDK tools installed, you'll need to use an external service to build the APK. This document provides instructions for building the APK using various methods.

## Option 1: Using an Online Android APK Builder Service

Several online services allow you to build Android APKs without needing to install the Android SDK locally.

### Steps:

1. **Export your project**
   - Download the entire project as a ZIP file from Replit
   - Make sure you have run `npm run build` first to generate the production web files

2. **Choose an Online Android APK Builder Service**
   - [AppBuilder.io](https://appbuilder.io)
   - [BuildAPK.online](https://buildapk.online)
   - [Capacitor APK Online](https://capacitorapkonline.com)

3. **Upload your project**
   - Upload your project ZIP file to the selected service
   - Most services will recognize Capacitor projects automatically

4. **Configure Build Options**
   - Package name: `com.pantrypal.app`
   - App name: `PantryPal`
   - Version code: `1`
   - Version name: `1.0.0`

5. **Generate Keystore or Upload Yours**
   - For testing, you can use a service-generated keystore
   - For production, upload your own keystore for app signing

6. **Start the Build**
   - Initiate the build process
   - Wait for the service to compile your Android app
   - Download the resulting APK file

## Option 2: Using GitHub Actions

If you prefer a more automated approach, you can use GitHub Actions to build your APK.

### Steps:

1. **Push your project to GitHub**
   - Create a new GitHub repository
   - Push your project code to the repository

2. **Create a workflow file**
   - Create a file at `.github/workflows/build-android.yml`
   - Use the template below:

```yaml
name: Build Android APK

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 16
          
      - name: Install dependencies
        run: npm install
      
      - name: Build web app
        run: npm run build
      
      - name: Sync Capacitor files
        run: npx cap sync
      
      - name: Set up JDK 11
        uses: actions/setup-java@v3
        with:
          java-version: '11'
          distribution: 'temurin'
          
      - name: Setup Android SDK
        uses: android-actions/setup-android@v2
      
      - name: Build debug APK
        run: |
          cd android
          ./gradlew assembleDebug
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-debug
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

3. **Trigger a build**
   - Push to your main branch or manually trigger the workflow
   - Download the APK from the Actions tab in your GitHub repository

## Option 3: Local Build with Remote Access to Android Studio

If you have access to a computer with Android Studio installed, you can:

1. **Download the project**
   - Download the ZIP file of your project from Replit

2. **Open the project in Android Studio**
   - Extract the ZIP file
   - Open Android Studio and import the project by selecting the `android` folder

3. **Build the APK**
   - Click on Build → Build Bundle(s) / APK(s) → Build APK(s)
   - The APK will be generated in the `android/app/build/outputs/apk/debug/` directory

## Testing the APK

After obtaining the APK file:

1. **Install on a physical device**
   - Enable "Install from Unknown Sources" in your device settings
   - Transfer the APK to your device and install it

2. **Install on an emulator**
   - Use Android Studio's emulator
   - Or use a service like [BrowserStack](https://www.browserstack.com/) for testing on various virtual devices

3. **Test all features**
   - Verify all functionality works as expected
   - Check native features like camera access
   - Test deep links and shortcuts

## Troubleshooting Common APK Build Issues

- **Missing dependencies**: Ensure all required npm packages are installed
- **Build configuration errors**: Check the capacitor.config.ts file for correct settings
- **Native plugin issues**: Verify all Capacitor plugins are properly installed and configured
- **Signing issues**: For release builds, make sure your keystore information is correct

If you encounter specific errors during the build process, check the build logs for detailed information and error messages.

## Preparing for Google Play Store Submission

Once you have successfully built and tested your APK, refer to the `GOOGLE_PLAY_STORE_SUBMISSION.md` file for instructions on how to prepare and submit your app to the Google Play Store.