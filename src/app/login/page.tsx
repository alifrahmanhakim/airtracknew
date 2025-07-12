
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
import { signInWithPopup, User as FirebaseAuthUser, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import type { User } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [isLoginView, setIsLoginView] = useState(true);

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginIsLoading, setLoginIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Signup State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupIsLoading, setSignupIsLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  
  // Google State
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);


  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginIsLoading(true);
    setLoginError('');

    try {
      if (!loginEmail) {
        setLoginError("Please enter an email address.");
        setLoginIsLoading(false);
        return;
      }
      
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", loginEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setLoginError("No user found with this email. Please check your credentials or sign up.");
        setLoginIsLoading(false);
        return;
      }
      
      const userDoc = querySnapshot.docs[0];
      localStorage.setItem('loggedInUserId', userDoc.id);
      window.location.href = '/dashboard';

    } catch (err) {
      console.error("Login Error:", err);
      setLoginError("An error occurred during login. Please try again.");
      setLoginIsLoading(false);
    }
  };
  
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupIsLoading(true);
    setSignupError('');

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", signupEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setSignupError("An account with this email already exists. Please log in.");
        setSignupIsLoading(false);
        return;
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      const firebaseUser = userCredential.user;
      
      await updateProfile(firebaseUser, { displayName: signupName });

      const newUser: User = {
        id: firebaseUser.uid,
        name: signupName,
        email: signupEmail,
        avatarUrl: `https://placehold.co/100x100.png`,
        role: 'Functional'
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

      localStorage.setItem('loggedInUserId', firebaseUser.uid);
      window.location.href = '/dashboard';

    } catch (err: any) {
      console.error("Signup Error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setSignupError("This email is already in use. Please log in.");
      } else if (err.code === 'auth/weak-password') {
        setSignupError("Password should be at least 6 characters.");
      } else {
        setSignupError("An error occurred during sign up. Please try again.");
      }
      setSignupIsLoading(false);
    }
  };

  
  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    setLoginError('');
    setSignupError('');

    try {
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("email", "==", firebaseUser.email));
        const userSnap = await getDocs(q);

        let userIdToLogin: string;

        if (userSnap.empty) {
            // User doesn't exist, create a new document
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
            // User exists, get their ID to log in.
            userIdToLogin = userSnap.docs[0].id;
        }

        localStorage.setItem('loggedInUserId', userIdToLogin);
        window.location.href = '/dashboard';

    } catch (err) {
        console.error("Google Auth Error:", err);
        const errorMsg = "Failed to sign in with Google. Please try again.";
        setLoginError(errorMsg);
        setSignupError(errorMsg);
        setIsGoogleLoading(false);
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-cover bg-center p-4" style={{backgroundImage: "url('/background.jpg')"}}>
        <div className="absolute inset-0 bg-black/50" />
      <Card className="relative w-full max-w-sm bg-white/10 backdrop-blur-lg border-white/20 text-white animate-in fade-in-0 zoom-in-95 duration-500 overflow-hidden">
        <div className={cn("transition-transform duration-700 ease-in-out flex", !isLoginView && "-translate-x-full")}>
            <div className="w-full flex-shrink-0">
                <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground">
                            <Plane className="h-6 w-6" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">AirTrack Login</CardTitle>
                    <CardDescription className="text-white/80">Enter your credentials to access your dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <Input id="login-email" type="email" placeholder="name@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required className="bg-white/10 border-white/20 placeholder:text-white/60"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="login-password">Password</Label>
                            <Input id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" required className="bg-white/10 border-white/20 placeholder:text-white/60" />
                        </div>
                        {loginError && <p className="text-sm text-red-400 text-center">{loginError}</p>}
                        <Button type="submit" className="w-full transition-transform hover:scale-105" disabled={loginIsLoading}>
                            {loginIsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Login
                        </Button>
                    </form>
                    <p className="mt-4 text-center text-sm">Don't have an account?{" "}
                        <button onClick={() => setIsLoginView(false)} className="underline hover:text-primary">Sign up</button>
                    </p>
                </CardContent>
            </div>

            <div className="w-full flex-shrink-0">
                <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground">
                            <Plane className="h-6 w-6" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Create an Account</CardTitle>
                    <CardDescription className="text-white/80">Enter your details to get started.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleEmailSignup} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="signup-name">Name</Label>
                            <Input id="signup-name" type="text" placeholder="John Doe" value={signupName} onChange={(e) => setSignupName(e.target.value)} required className="bg-white/10 border-white/20 placeholder:text-white/60" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-email">Email</Label>
                            <Input id="signup-email" type="email" placeholder="name@example.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required className="bg-white/10 border-white/20 placeholder:text-white/60"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-password">Password</Label>
                            <Input id="signup-password" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="••••••••" required className="bg-white/10 border-white/20 placeholder:text-white/60"/>
                        </div>
                        {signupError && <p className="text-sm text-red-400 text-center">{signupError}</p>}
                        <Button type="submit" className="w-full transition-transform hover:scale-105" disabled={signupIsLoading}>
                            {signupIsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign Up
                        </Button>
                    </form>
                    <p className="mt-4 text-center text-sm">Already have an account?{" "}
                        <button onClick={() => setIsLoginView(true)} className="underline hover:text-primary">Log in</button>
                    </p>
                </CardContent>
            </div>
        </div>
      </Card>
    </main>
  );
}
