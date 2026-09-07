# Vehicle Finance Manager - React Native (Android & iOS)

A complete native mobile application for **Vehicle Finance & EMI Loan Management**, converted from the React web platform to **React Native** (Expo / Bare Native).

---

## 📱 Mobile Features Included

1. **Dashboard Overview**:
   - Total Disbursed Capital, Active Loans Count, Total Collected (Principal & Interest), Overdue Portfolio count.
   - Quick navigation shortcuts: EMI Tracker, New Loan Application, Collect Payment.
   - Upcoming due dates preview.

2. **EMI Tracker & Obligation Management**:
   - Upcoming payment obligation cards organized by urgency (Overdue, Due Today, Due in 7 Days, Due in 15 Days, This Month).
   - Instant search by Customer Name, Phone, Vehicle Number, or File Number.
   - One-touch **WhatsApp Reminder** sender with pre-filled professional notice message (`Linking.openURL`).
   - One-touch **Phone Call** trigger (`tel:` URI).
   - In-app **Record EMI Payment** modal with payment mode selection (UPI, Cash, Bank Transfer, Cheque) and notes.

3. **Loan Accounts Management**:
   - Complete portfolio list with progress bars showing repaid installments vs total tenure.
   - Filter by status (Active, Closed) and search.
   - Floating Action Button (FAB) to quickly sanction new loans.

4. **Detailed Loan Profile**:
   - Customer profile, contact actions, address.
   - Vehicle specifications: Make, Model, Registration Number, Engine Number, Chassis Number, On-road cost.
   - Financing terms: Principal, Down Payment, Interest Rate (% p.a.), Tenure in months, Monthly EMI.
   - Full **Amortization Schedule** with real-time status (Paid, Due, Overdue, Upcoming) and individual payment actions.

5. **New Loan Origination**:
   - 4-step wizard: Customer Details, Vehicle Details, Financing Terms, Guarantor Information.
   - Real-time automatic EMI calculation based on Principal, ROI, and Tenure.
   - Instant schedule generation and file number assignment (`VF-YYYY-XXX`).

6. **Offline-First Persistence**:
   - Powered by `@react-native-async-storage/async-storage` for reliable offline mobile storage on Android devices.

---

## 🚀 How to Run on Android

### Prerequisites
- Install [Node.js (v18+)](https://nodejs.org)
- Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) from Google Play Store on your Android phone

### 1. Install Dependencies
```bash
cd react-native-app
npm install
```

### 2. Start the Development Server
```bash
npx expo start
```
- A QR code will appear in your terminal.
- Open the **Expo Go** app on your Android phone and tap **"Scan QR code"**.
- The app will bundle and load directly on your physical Android device with live reload!

### 3. Run on Android Emulator
If you have Android Studio and an Android Virtual Device (AVD) running:
```bash
npx expo start --android
```

---

## 📦 How to Build an Android APK (`.apk` / `.aab`)

### Option A: Cloud Build with EAS (Easiest - No Android Studio required)
1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Log in to your free Expo account:
   ```bash
   eas login
   ```
3. Configure the build:
   ```bash
   eas build:configure
   ```
4. Build a standalone Android APK:
   ```bash
   eas build -p android --profile preview
   ```
   *EAS will compile the Android APK in the cloud and provide a direct download link to install the `.apk` on any Android phone.*

---

### Option B: Local Android Build (via Android Studio / Gradle)
1. Generate native Android project files:
   ```bash
   npx expo prebuild --platform android
   ```
2. Open the generated `android/` directory in **Android Studio** or build from terminal:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   *The signed APK will be generated at `android/app/build/outputs/apk/release/app-release.apk`.*
