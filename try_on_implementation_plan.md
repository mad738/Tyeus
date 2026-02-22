# Implementation Plan: Virtual Try-On Feature (Free Fire Vibe)

## 1. Objective
Build a high-fidelity virtual try-on feature where a user uploads a photo of themselves, and the AI superimposes a selected garment from our catalog onto their body, matching the lighting, pose, and applying a vibrant, stylized "Free Fire / Gaming" aesthetic.

## 2. Architecture Overview
- **Frontend (Next.js)**: A modal or dedicated section for the "Try-On" experience. It handles image uploads, displays a loading state with punchy animations, and presents the final stylized image.
- **Backend (NestJS / Next.js API Routes)**: We will create a robust service layer to handle image processing and communicate securely with the Google Gemini API.
- **AI Engine (Gemini 3.1 Pro)**: Utilized for high-fidelity garment transfer using the `@google/generative-ai` SDK.

## 3. Folder Structure Updates
```text
/ (Root)
├── backend/                  <-- (New) NestJS Backend (if strictly separating backend)
│   ├── src/
│   │   ├── try-on/
│   │   │   ├── try-on.controller.ts
│   │   │   ├── try-on.service.ts  <-- Gemini API Integration here
│   │   │   └── try-on.module.ts
│   │   └── app.module.ts
│   └── package.json
│
└── login-demo/               <-- Current Next.js App
    ├── src/
    │   ├── app/
    │   │   ├── api/
    │   │   │   └── try-on/    <-- (Alternative) Next.js API route if not using NestJS
    │   │   │       └── route.ts
    │   │   ├── product/
    │   │   │   └── [id]/
    │   │   │       └── page.tsx <-- Where the Try-On button will live
    │   ├── components/
    │   │   └── TryOnModal.tsx   <-- New UI Component
    │   └── styles/
    │       └── globals.css      <-- Glitch and neon animations
```

## 4. API Logic (Backend)
**Endpoint**: `POST /api/try-on`
**Payload**:
- `user_photo` (Base64 or multipart form data)
- `product_image_url` (String URL of the garment)

**Service Logic (`TryOnService`)**:
1. Receive and validate images.
2. Initialize Gemini 3.1 Pro client (`@google/generative-ai`).
3. Construct the multipart request for Gemini.
4. **System Instruction**: "You are a professional game asset designer. Your task is to perform a high-fidelity garment transfer."
5. **User Prompt**: "Put the shirt from image 2 on the person in image 1. Match the lighting and body pose. Apply a stylized vibrant gaming filter similar to Garena Free Fire. Return only the final image."
6. Handle potential errors (rate limits, image size too large, API timeouts).
7. Return the processed image URL or Base64 string to the frontend.

## 5. UI / UX Design (Frontend Vibe)
- **Theme**: Dark mode, deep purples, neon accents.
- **Try-On Button**: "Legendary Item" aesthetic. Subtle purple glow (`box-shadow`), angular borders, and a CSS "glitch" effect on hover.
- **Loading State ("Running")**: Instead of a basic spinner, use a scanning laser effect over the user's photo or a neon loading bar that fits the gaming vibe.

## 6. Task Checklist
- [ ] **Phase 1: Foundation**
  - [ ] Set up the backend structure (either NestJS module or Next.js API Route).
  - [ ] Install `@google/generative-ai` SDK.
  - [ ] Secure API keys in `.env` and verify connection.
- [ ] **Phase 2: UI Implementation**
  - [ ] Create the `TryOnModal` component in Next.js.
  - [ ] Add the image upload input for the user's photo.
  - [ ] Design the "Legendary" Try-On button with Tailwind glitch/glow effects.
- [ ] **Phase 3: AI Integration**
  - [ ] Write the `TryOnService` logic to call the Gemini API.
  - [ ] Configure the prompt to enforce the Free Fire aesthetic.
  - [ ] Implement robust error handling (API busy, file too large).
- [ ] **Phase 4: Polish & Test**
  - [ ] Connect the frontend modal to the backend API.
  - [ ] Add the scanning "Running" animation while waiting for the AI response.
  - [ ] Test with various garments and user photos.
