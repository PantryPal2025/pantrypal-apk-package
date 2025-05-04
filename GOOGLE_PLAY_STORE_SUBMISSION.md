# Google Play Store Submission Guide for PantryPal

This document outlines the steps required to prepare and submit the PantryPal app to the Google Play Store.

## Prerequisites

1. A Google Play Developer account ($25 one-time fee)
2. Google Play Console access
3. Android Studio installed for final APK/Bundle generation
4. PNG app icon (512x512, 192x192, 144x144, 96x96, 72x72, 48x48)
5. Feature graphic (1024x500 PNG)
6. At least 2 screenshots of the app in use (per device type)
7. Short and long descriptions of the app
8. Privacy policy URL

## Build Process

1. Ensure you've run the build script to prepare the Android app:
   ```
   ./build-android.sh
   ```

2. Open Android Studio with the generated project:
   ```
   npx cap open android
   ```

3. In Android Studio:
   - Set the appropriate package name in `android/app/build.gradle` (com.pantrypal.app)
   - Configure signing keys in `android/app/build.gradle` 
   - Build a signed APK or App Bundle (App Bundle preferred for Play Store)

## App Store Metadata

### App Information

- **App Title**: PantryPal
- **Short Description** (80 characters max):
  The intelligent kitchen companion that helps reduce food waste and simplify meal planning.

- **Full Description** (4000 characters max):
  PantryPal is your intelligent kitchen companion that helps you plan meals, reduce food waste, and enhance your cooking experience with advanced tracking capabilities.

  Key Features:
  - Inventory Management: Keep track of all your food items with expiration dates
  - Barcode Scanning: Quickly add items to your inventory by scanning product barcodes
  - Meal Planning: Plan your meals for the week and generate shopping lists
  - Recipe Suggestions: Get recipe ideas based on what's in your inventory
  - Food Waste Tracking: Track and reduce food waste with detailed statistics
  - Family Sharing: Share your pantry with family members and coordinate grocery shopping
  - Gamification: Earn points and achievements for reducing food waste

  PantryPal helps you make the most of your food, save money, and contribute to a more sustainable future.

### Content Rating Questionnaire

The app will need a content rating. Be prepared to complete the content rating questionnaire in the Google Play Console which asks about:
- Violence
- Sexual content
- Profanity
- Controlled substances
- User-generated content
- etc.

PantryPal should be rated for all ages (E for Everyone).

### Privacy Policy

1. Use the included PRIVACY_POLICY_TEMPLATE.md as a starting point to create your privacy policy. 
   It already covers the essential elements required by Google Play:
   - What data is collected (inventory items, shopping lists, recipes, user accounts)
   - How data is used (to provide the app's functionality)
   - Data sharing practices (household sharing features)
   - Third-party services (Stripe for payments, Firebase for analytics)
   - User rights (accessing, modifying, and deleting data)
   - Contact information

2. Customize the template with your specific information and host it on a website.
   Some free or low-cost hosting options include:
   - GitHub Pages
   - Netlify
   - WordPress.com
   - Google Sites

3. Provide the URL of your hosted privacy policy during the submission process.
   
Note: A proper privacy policy is mandatory for all apps on the Google Play Store, even if your app doesn't collect sensitive user data.

## Final Checklist Before Submission

- [ ] App has been thoroughly tested on different Android devices
- [ ] App icon and graphics meet Google Play requirements
- [ ] App descriptions and screenshots are ready
- [ ] Privacy policy is in place
- [ ] Content rating questionnaire answers are prepared
- [ ] Signed APK or App Bundle is generated
- [ ] App complies with Google Play Store policies

## Submission Process

1. Log in to the Google Play Console
2. Create a new app
3. Fill in all required information
4. Upload the signed APK or App Bundle
5. Set pricing and distribution (free/paid, countries)
6. Complete the content rating questionnaire
7. Submit for review

The review process typically takes 2-7 days.

## Post-Submission

After submission, you can track the status of your app in the Google Play Console. Be prepared to address any issues raised by the Google Play team during the review process.