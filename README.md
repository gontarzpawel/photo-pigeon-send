
# Photo Pigeon - Send Photos to Custom HTTP Backends

A responsive web application that allows users to capture photos from their camera or upload photos from their device, then send them to a custom HTTP backend server.

## Project info

**URL**: https://lovable.dev/projects/53de85d0-92b3-4cbf-b661-c7daaafbf360

## Features

- Take photos using your device's camera
- Upload photos from your device
- Preview photos before sending
- Send photos to a custom HTTP backend
- Responsive design that works on mobile and desktop

## How to use

1. Enter the URL of your HTTP backend server in the "Server URL" field
2. Choose between "Upload Photo" and "Take Photo" tabs
3. Either select a photo from your device or capture one using your camera
4. Preview the photo
5. Click "Send Photo" to upload it to your server
6. The server should accept form data with a field named "photo" containing the image file

## Technical details

The application uses:

- React with TypeScript
- Tailwind CSS for styling
- shadcn/ui components
- Web APIs for camera access
- FormData for HTTP uploads

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/53de85d0-92b3-4cbf-b661-c7daaafbf360) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Technologies used

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/53de85d0-92b3-4cbf-b661-c7daaafbf360) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
