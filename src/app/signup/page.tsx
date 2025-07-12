
'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plane, Loader2 } from "lucide-react";
import { useState } from 'react';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { db, auth, googleProvider } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import type { User } from '@/lib/types';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Check if user already exists
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError("An account with this email already exists. Please log in.");
        setIsLoading(false);
        return;
      }
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update profile
      await updateProfile(firebaseUser, { displayName: name });

      // Create user document in Firestore
      const newUser: User = {
        id: firebaseUser.uid,
        name: name,
        email: email,
        avatarUrl: `https://placehold.co/100x100.png`,
        role: 'Functional'
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

      // Log the user in
      localStorage.setItem('loggedInUserId', firebaseUser.uid);
      window.location.href = '/dashboard';

    } catch (err: any) {
      console.error("Signup Error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already in use. Please log in.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError("An error occurred during sign up. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;

        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDocs(query(collection(db, 'users'), where('email', '==', firebaseUser.email)));

        let userIdToLogin = firebaseUser.uid;

        if (userSnap.empty) {
            // User doesn't exist, so create a new document (sign up)
            const newUser: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'New User',
                email: firebaseUser.email || '',
                avatarUrl: firebaseUser.photoURL || `https://placehold.co/100x100.png`,
                role: 'Functional' // Default role for new sign-ups
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            userIdToLogin = firebaseUser.uid;
        } else {
            // User exists, just get their ID to log in.
            userIdToLogin = userSnap.docs[0].id;
        }

        localStorage.setItem('loggedInUserId', userIdToLogin);
        window.location.href = '/dashboard';

    } catch (err) {
        console.error("Google Login Error:", err);
        setError("Failed to sign in with Google. Please try again.");
        setIsGoogleLoading(false);
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm animate-in fade-in-0 zoom-in-95 duration-500">
        <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground">
                    <Plane className="h-6 w-6" />
                </div>
            </div>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>
            Enter your details to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                type="text" 
                placeholder="John Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            
            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button type="submit" className="w-full transition-transform hover:scale-105" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Up
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or sign up with</span>
            </div>
          </div>
        
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isGoogleLoading}>
            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
              <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.98-4.66 1.98-3.56 0-6.21-2.76-6.21-6.22s2.65-6.22 6.21-6.22c2.03 0 3.28.79 4.25 1.74l2.53-2.39C18.49 3.46 15.96 2 12.48 2 7.1 2 3.1 6.02 3.1 11s4.01 9 9.38 9c5.14 0 9.02-3.46 9.02-9.22 0-.6-.06-1.18-.16-1.74h-8.88z"></path></svg>
            )}
            Google
          </Button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="underline hover:text-primary">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
