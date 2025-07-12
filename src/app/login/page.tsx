
'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plane, Loader2 } from "lucide-react";
import { useState } from 'react';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    updateProfile, 
    type User as FirebaseAuthUser 
} from 'firebase/auth';
import type { User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage() {
  const router = useRouter();
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // We still check firestore to get the document ID which might be different from auth UID if seeded.
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // This case is unlikely if auth passes, but good for safety.
        setError("User data not found in database. Please contact support.");
        setIsLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      localStorage.setItem('loggedInUserId', userDoc.id);
      window.location.href = '/dashboard';

    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("Invalid email or password. Please try again.");
      } else {
        setError("An error occurred during login. Please try again.");
      }
      setIsLoading(false);
    }
  };
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Firebase Auth will handle the check for existing email.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      await updateProfile(firebaseUser, { displayName: name });

      // Create a new user document in Firestore with the auth UID as the ID.
      const newUser: Omit<User, 'id'> = {
        name: name,
        email: email,
        avatarUrl: `https://placehold.co/100x100.png`,
        role: 'Functional' // All new users start with the 'Functional' role.
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

      // Log the new user in
      localStorage.setItem('loggedInUserId', firebaseUser.uid);
      window.location.href = '/dashboard';

    } catch (err: any) {
      console.error("Signup Error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("An account with this email already exists. Please log in.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError("An error occurred during sign up. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const currentFormSubmit = isLoginView ? handleLogin : handleSignup;
  const currentButtonText = isLoginView ? "Login" : "Sign Up";

  return (
    <main className="relative flex items-center justify-center min-h-screen bg-cover bg-center p-4" style={{backgroundImage: "url('https://firebasestorage.googleapis.com/v0/b/aoc-insight.firebasestorage.app/o/bg%2FGemini_Generated_Image_rx0ml4rx0ml4rx0m.png?alt=media&token=e8a8ffa5-d518-45cf-a33c-b2392d5d7ad5')"} }>
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="absolute inset-0 bg-black/50" />
      <Card className="relative w-full max-w-sm bg-card/10 backdrop-blur-lg border-white/20 text-white animate-in fade-in-0 zoom-in-95 duration-500 overflow-hidden">
        <div className={cn("transition-transform duration-700 ease-in-out flex", !isLoginView && "-translate-x-full")}>
            {/* Login View */}
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
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <Input id="login-email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/10 border-white/20 placeholder:text-white/60"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="login-password">Password</Label>
                            <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="bg-white/10 border-white/20 placeholder:text-white/60" />
                        </div>
                        {isLoginView && error && <p className="text-sm text-red-400 text-center">{error}</p>}
                        <Button type="submit" className="w-full transition-transform hover:scale-105" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Login
                        </Button>
                    </form>
                    <p className="mt-4 text-center text-sm">Don't have an account?{" "}
                        <button onClick={() => { setIsLoginView(false); setError(''); }} className="underline hover:text-primary">Sign up</button>
                    </p>
                </CardContent>
            </div>

            {/* Signup View */}
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
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="signup-name">Name</Label>
                            <Input id="signup-name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required className="bg-white/10 border-white/20 placeholder:text-white/60" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-email">Email</Label>
                            <Input id="signup-email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/10 border-white/20 placeholder:text-white/60"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-password">Password</Label>
                            <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="bg-white/10 border-white/20 placeholder:text-white/60"/>
                        </div>
                        {!isLoginView && error && <p className="text-sm text-red-400 text-center">{error}</p>}
                        <Button type="submit" className="w-full transition-transform hover:scale-105" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign Up
                        </Button>
                    </form>
                    <p className="mt-4 text-center text-sm">Already have an account?{" "}
                        <button onClick={() => { setIsLoginView(true); setError(''); }} className="underline hover:text-primary">Log in</button>
                    </p>
                </CardContent>
            </div>
        </div>
      </Card>
    </main>
  );
}
