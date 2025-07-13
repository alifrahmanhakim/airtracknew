
'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plane, Loader2, CheckCircle } from "lucide-react";
import { useState } from 'react';
import { collection, query, where, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    updateProfile, 
    signOut,
} from 'firebase/auth';
import type { User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSignupSuccess(false);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
          await signOut(auth);
          setError("User data not found in our records. Please contact support.");
          setIsLoading(false);
          return;
      }

      const userData = userSnap.data() as User;

      if (!userData.isApproved) {
          await signOut(auth);
          setError("Your account is pending approval by an administrator. Please check back later.");
          setIsLoading(false);
          return;
      }

      localStorage.setItem('loggedInUserId', userSnap.id);
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
    setSignupSuccess(false);

    try {
      // Firebase Auth will handle the check for existing email.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      await updateProfile(firebaseUser, { displayName: name });

      const newUser: Omit<User, 'id'> = {
        name: name,
        email: email,
        avatarUrl: `https://placehold.co/100x100.png`,
        role: 'Functional', // All new users start with the 'Functional' role.
        isApproved: false, // Wait for admin approval
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      
      // Don't log the user in, show success message instead.
      setSignupSuccess(true);
      setIsLoginView(true); // Switch back to login view
      setName('');
      setEmail('');
      setPassword('');

    } catch (err: any) {
      console.error("Signup Error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("An account with this email already exists. Please log in.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError("An error occurred during sign up. Please try again.");
      }
    } finally {
        setIsLoading(false);
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError('');
    setSignupSuccess(false);
    setName('');
    setPassword('');
  }

  return (
    <main className="relative flex items-center justify-center min-h-screen bg-cover bg-center p-4" style={{backgroundImage: "url('https://firebasestorage.googleapis.com/v0/b/aoc-insight.firebasestorage.app/o/bg%2FGemini_Generated_Image_rx0ml4rx0ml4rx0m.png?alt=media&token=e8a8ffa5-d518-45cf-a33c-b2392d5d7ad5')"} }>
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative flex flex-col items-center">
        <Card className="w-full max-w-sm bg-card/10 backdrop-blur-lg border-white/20 text-white animate-in fade-in-0 zoom-in-95 duration-500 overflow-hidden">
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
                      {signupSuccess && (
                          <Alert variant="default" className="mb-4 bg-green-500/20 border-green-500/50 text-green-300">
                             <CheckCircle className="h-4 w-4 !text-green-400" />
                             <AlertTitle className="text-green-300 font-bold">Registration Successful!</AlertTitle>
                             <AlertDescription className="text-green-400">
                                 Your account has been created. Please wait for an administrator to approve it.
                             </AlertDescription>
                          </Alert>
                      )}
                       {error && (
                          <Alert variant="destructive" className="mb-4">
                             <AlertTitle>Login Failed</AlertTitle>
                             <AlertDescription>{error}</AlertDescription>
                          </Alert>
                      )}
                      <form onSubmit={handleLogin} className="space-y-4">
                          <div className="space-y-2">
                              <Label htmlFor="login-email">Email</Label>
                              <Input id="login-email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/10 border-white/20 placeholder:text-white/60"/>
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="login-password">Password</Label>
                              <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="bg-white/10 border-white/20 placeholder:text-white/60" />
                          </div>
                          <Button type="submit" className="w-full transition-transform hover:scale-105" disabled={isLoading}>
                              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Login
                          </Button>
                      </form>
                  </CardContent>
                  <CardFooter>
                      <p className="w-full text-center text-sm">Don't have an account?{" "}
                          <button onClick={toggleView} className="underline hover:text-primary">Sign up</button>
                      </p>
                  </CardFooter>
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
                      <CardDescription className="text-white/80">Register to request access.</CardDescription>
                  </CardHeader>
                  <CardContent>
                       {error && (
                          <Alert variant="destructive" className="mb-4">
                             <AlertTitle>Signup Failed</AlertTitle>
                             <AlertDescription>{error}</AlertDescription>
                          </Alert>
                      )}
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
                          <Button type="submit" className="w-full transition-transform hover:scale-105" disabled={isLoading}>
                              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign Up
                          </Button>
                      </form>
                  </CardContent>
                   <CardFooter>
                       <p className="w-full text-center text-sm">Already have an account?{" "}
                          <button onClick={toggleView} className="underline hover:text-primary">Log in</button>
                      </p>
                  </CardFooter>
              </div>
          </div>
        </Card>
        <p className="mt-4 text-center text-xs text-white/60">
            Deep Learning Agentic AI developed by STD.DATABASE.Ai<br />
            TnC AI can make mistakes, so double-check it
        </p>
      </div>
    </main>
  );
}
