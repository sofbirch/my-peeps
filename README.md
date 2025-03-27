# My Peeps

A React application for managing your contacts and groups with profile pictures. Built with Firebase, Cloudinary, and Chakra UI.

## Features

- 🔐 User Authentication
- 👥 Contact Management
- 👥 Group Management
- 📸 Profile Picture Upload
- 🎨 Modern UI with Chakra UI
- 🔄 Real-time Updates
- 📱 Responsive Design

## Tech Stack

- React + TypeScript
- Firebase (Authentication & Firestore)
- Cloudinary (Image Storage)
- Chakra UI (Component Library)
- Vite (Build Tool)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- Cloudinary account

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/sofbirch/my-peeps.git
cd my-peeps
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your environment variables (see above)

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Usage

1. Sign up for a new account or log in
2. Add new contacts with profile pictures
3. Create groups and add contacts to them
4. Edit or delete contacts and groups as needed

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Firebase](https://firebase.google.com/)
- [Cloudinary](https://cloudinary.com/)
- [Chakra UI](https://chakra-ui.com/)
- [React](https://reactjs.org/) 