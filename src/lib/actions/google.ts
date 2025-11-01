
'use server';

import { google } from 'googleapis';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { headers } from 'next/headers';

const SCOPES = [
    'https://www.googleapis.com/auth/calendar.events', // Keep existing calendar scope
    'https://www.googleapis.com/auth/drive.readonly'   // Add read-only scope for Google Drive
];

function getOAuth2Client() {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
        console.error("Google OAuth credentials are not configured in .env file.");
        return null;
    }

    return new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
    );
}

export async function getGoogleAuthUrl(userId: string) {
    const oauth2Client = getOAuth2Client();
    if (!oauth2Client) {
        return { success: false, error: 'Google OAuth credentials are not configured.' };
    }

    try {
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline', // Important to get a refresh token
            prompt: 'consent',      // Force consent screen to get refresh token for new scopes
            scope: SCOPES,
            state: JSON.stringify({ userId }), // Pass user ID to identify them in the callback
        });
        return { success: true, authUrl };
    } catch (error) {
        console.error('Error generating Google Auth URL:', error);
        return { success: false, error: 'Failed to generate authentication URL.' };
    }
}
