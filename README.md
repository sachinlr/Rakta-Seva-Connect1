# Rakta-Seva Connect (Healthcare Bridge)

**Rakta-Seva Connect** is a life-saving digital bridge designed to connect hospitals and people in need with voluntary blood donors in real-time. It focuses on the "Golden Hour" of medical treatment by organizing "Replacement Donors" at the taluka level.

## 🚀 Key Features

- **Donor Registry:** Secure registration with blood group, last donation date, and availability status.
- **Emergency Broadcasts:** Hospitals can post urgent requirements that are pushed to all nearby registered donors.
- **Proximity-Based Alerts:** A specialized logic matches donors within a **10km radius** to ensure rapid response.
- **Eligibility Guard:** Automatically hides or disables donation options for donors who have donated in the last **90 days**.
- **Privacy First:** Donor contact details (phone numbers) are hidden and only shared with the requester once the donor explicitly **accepts** the emergency call.
- **AI Emergency Guidance:** Powered by **Gemini AI**, providing donors with instant medical tips, preparation guides, and safety precautions upon accepting a request.

## 🛠️ Technical Stack

- **Frontend:** React 19 + Vite + Tailwind CSS (v4)
- **Backend/Database:** Firebase Firestore (Real-time updates)
- **Authentication:** Firebase Google Authentication
- **AI Integration:** Google Gemini SDK (`@google/genai`)
- **Animations:** Motion (formerly Framer Motion)
- **UI Components:** Shadcn/UI (Radix primitives)
- **Location Logic:** `geofire-common` for distance calculations and geohashing.

## 📦 Getting Started

### Prerequisites

1. **Firebase Project:** You need a Firebase project with Firestore and Authentication (Google) enabled.
2. **Gemini API Key:** Obtain an API key from the [Google AI Studio](https://aistudio.google.com/).

### Setup

1. **Environment Variables:**
   Create a `.env` file (or use the Secrets panel in AI Studio) and add:
   ```env
   GEMINI_API_KEY="your_gemini_api_key"
   ```

2. **Firebase Configuration:**
   Ensure your `firebase-applet-config.json` is correctly populated with your project credentials.

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

## 🛡️ Security & Rules

The app implements hardened **Firestore Security Rules**:
- **Identity Integrity:** Users can only modify their own profiles.
- **PII Isolation:** Phone numbers are stored in a private subcollection `acceptedDonors` within each request, accessible only to the person who posted the request and only after the donor opts-in.
- **Schema Validation:** Strict type checking and key validation for all writes.

## 📍 Location Logic
The app uses the Haversine formula via `geofire-common` to filter blood requests based on the physical distance (10km) between the hospital and the donor's last known location.

## 🤖 AI Features
When a donor views an alert, they can click the **Sparkles** icon to receive real-time, AI-generated guidance from Gemini on how to prepare for the donation and immediate safety tips.

---
*Built with ❤️ for a safer, healthier community.*
