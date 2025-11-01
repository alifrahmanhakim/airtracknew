
'use server';

import { google } from 'googleapis';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const SCOPES = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/drive.readonly'
];

function getOAuth2Client() {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
        // We return null instead of throwing an error to be handled gracefully.
        return null;
    }
    return new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
    );
}

// This function will be called by Google after the user grants consent.
// We need a way to expose this as a public endpoint. This is a limitation for now.
// For now, let's assume we can get the code and store the token.
export async function handleGoogleCallback(code: string, userId: string) {
    const oauth2Client = getOAuth2Client();
    if (!oauth2Client) {
        return { success: false, error: 'Google OAuth credentials are not configured.' };
    }
    try {
        const { tokens } = await oauth2Client.getToken(code);
        
        // Store the refresh token securely, associated with the user.
        // We'll use Firestore for this.
        const tokenRef = doc(db, 'user_tokens', userId);
        await setDoc(tokenRef, {
            googleRefreshToken: tokens.refresh_token,
        }, { merge: true });

        return { success: true };
    } catch (error) {
        console.error('Error handling Google callback:', error);
        return { success: false, error: 'Failed to retrieve access token.' };
    }
}

interface CreateMeetParams {
    summary: string;
    description: string;
    attendees: { email: string }[];
    userId: string;
}

export async function createGoogleMeet(params: CreateMeetParams) {
    const { userId } = params;

    const oauth2Client = getOAuth2Client();
    if (!oauth2Client) {
        return { success: false, error: 'Google OAuth credentials are not configured in the .env file.' };
    }

    const tokenRef = doc(db, 'user_tokens', userId);
    const tokenSnap = await getDoc(tokenRef);

    if (!tokenSnap.exists() || !tokenSnap.data()?.googleRefreshToken) {
        // No refresh token found, so we need to get user consent first.
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline', // Important to get a refresh token
            scope: SCOPES,
            prompt: 'consent',
            state: JSON.stringify({ userId }), // Pass user ID to identify them in the callback
        });
        return { authUrl };
    }

    try {
        const refreshToken = tokenSnap.data()!.googleRefreshToken;
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        const event = await calendar.events.insert({
            calendarId: 'primary',
            conferenceDataVersion: 1,
            requestBody: {
                summary: params.summary,
                description: params.description,
                start: {
                    dateTime: new Date().toISOString(),
                    timeZone: 'UTC',
                },
                end: {
                    dateTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
                    timeZone: 'UTC',
                },
                attendees: params.attendees,
                conferenceData: {
                    createRequest: {
                        requestId: `airtrack-${Date.now()}`,
                        conferenceSolutionKey: {
                            type: 'hangoutsMeet',
                        },
                    },
                },
            },
        });

        const meetLink = event.data.hangoutLink;
        if (!meetLink) {
             throw new Error('Google Meet link was not created.');
        }
        
        return { success: true, meetLink };

    } catch (error: any) {
        console.error('Error creating Google Meet:', error);
        // If the token is invalid, we might need to re-authenticate
        if (error.response?.data?.error === 'invalid_grant') {
             const authUrl = oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: SCOPES,
                prompt: 'consent',
                state: JSON.stringify({ userId }),
            });
            return { authUrl };
        }
        return { success: false, error: 'Failed to create Google Meet link.' };
    }
}
