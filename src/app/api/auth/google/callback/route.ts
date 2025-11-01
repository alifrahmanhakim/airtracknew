
import { NextResponse, type NextRequest } from 'next/server';
import { google } from 'googleapis';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
        return NextResponse.redirect(new URL('/profile?error=auth_failed', request.url));
    }

    try {
        const { userId } = JSON.parse(state);
        if (!userId) {
            throw new Error("User ID not found in state.");
        }

        const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
            throw new Error("Google OAuth credentials are not configured.");
        }
        
        const oauth2Client = new google.auth.OAuth2(
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            GOOGLE_REDIRECT_URI
        );

        const { tokens } = await oauth2Client.getToken(code);
        
        if (!tokens.refresh_token) {
            console.warn("Refresh token was not provided by Google. The user might have already granted consent for a different scope. Full re-authentication might be needed.");
        }
        
        const tokenRef = doc(db, 'user_tokens', userId);
        await setDoc(tokenRef, {
            googleRefreshToken: tokens.refresh_token,
            hasDriveAccess: true, // Flag that Drive access is (likely) granted
        }, { merge: true });

        // Redirect back to the profile page with a success message
        return NextResponse.redirect(new URL('/profile?status=google_connected', request.url));

    } catch (error) {
        console.error('Error handling Google callback:', error);
        return NextResponse.redirect(new URL('/profile?error=auth_callback_failed', request.url));
    }
}
