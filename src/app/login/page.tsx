
'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plane, Loader2, CheckCircle } from "lucide-react";
import { useState } from 'react';
import { collection, query, where, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth, googleProvider } from '@/lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    updateProfile, 
    signOut,
    signInWithPopup,
} from 'firebase/auth';
import type { User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StatusIndicator } from '@/components/status-indicator';
import Image from 'next/image';

const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);


export default function LoginPage() {
  const router = useRouter();
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSuccessfullLogin = (userId: string) => {
    localStorage.setItem('loggedInUserId', userId);
    window.location.href = '/my-dashboard';
  };
  
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');
    setSignupSuccess(false);

    try {
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            // User exists, check for approval
            const userData = userSnap.data() as User;
            if (!userData.isApproved) {
                await signOut(auth);
                setError("Your account is pending approval by an administrator. Please check back later.");
                setIsGoogleLoading(false);
                return;
            }
            handleSuccessfullLogin(firebaseUser.uid);
        } else {
            // New user, create DB entry and set as pending approval
            const newUser: Omit<User, 'id'> = {
                name: firebaseUser.displayName || 'Google User',
                email: firebaseUser.email,
                avatarUrl: firebaseUser.photoURL || `https://placehold.co/100x100.png`,
                role: 'Functional',
                department: 'Pegawai STD',
                isApproved: false,
            };
            await setDoc(userRef, newUser);
            await signOut(auth); // Sign out user until they are approved
            setSignupSuccess(true);
            setError('');
        }
    } catch (err: any) {
        console.error("Google Sign-In Error:", err);
        setError("An error occurred with Google Sign-In. Please try again.");
    } finally {
        setIsGoogleLoading(false);
    }
  };


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

      handleSuccessfullLogin(userSnap.id);

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
        department: 'Pegawai STD', // Default department
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
    <main className="relative flex items-center justify-center min-h-screen p-4" style={{ background: 'linear-gradient(135deg, midnightblue, #111)' }}>
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <section className="login-section">
        <div className="noise"></div>
        <div className="center">
            {/* The circle element can be placed here if desired */}
            {/* <div className="circle"></div> */}
        </div>
      </section>

      <div className="relative flex flex-col items-center gap-4">
        <Card className="w-full max-w-sm bg-card/10 backdrop-blur-lg border-white/20 text-white animate-in fade-in-0 zoom-in-95 duration-500 overflow-hidden transition-all hover:border-primary/50 hover:bg-gradient-to-t hover:from-primary/10">
            <div className="grid [grid-template-areas:'card-content']">
                {/* Login Form */}
                <div style={{gridArea: 'card-content'}} className={cn("w-full flex-shrink-0 transition-opacity duration-300", !isLoginView && "opacity-0 pointer-events-none")}>
                    <CardHeader className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                             <Image src="https://i.postimg.cc/3NNnNB5C/LOGO-AIRTRACK.png" alt="AirTrack Logo" width={240} height={240} className="object-contain" />
                        </div>
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
                        <form onSubmit={handleLogin} className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="login-email">Email</Label>
                                <Input id="login-email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/10 border-white/20 placeholder:text-white/60"/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="login-password">Password</Label>
                                <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="bg-white/10 border-white/20 placeholder:text-white/60" />
                            </div>
                            <Button type="submit" className="w-full transition-all hover:scale-105 active:bg-gradient-to-r active:from-pink-500 active:via-purple-500 active:to-blue-500" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Login
                            </Button>
                        </form>
                        <div className="relative my-3">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/20" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card/10 px-2 text-white/60">Or continue with</span>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full text-white bg-white/10 border-white/20 hover:bg-white/20" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
                            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                            Sign in with Google
                        </Button>
                    </CardContent>
                     <CardFooter className="flex-col items-center justify-center text-center text-sm pt-3 pb-4">
                        <p className="mb-2">Don't have an account?{" "}
                            <button onClick={toggleView} className="underline hover:text-primary">Sign up</button>
                        </p>
                          <p className="text-center text-xs text-white/60">
                            Deep Learning Agentic AI developed by STD.DATABASE.Ai<br />
                            TnC AI can make mistakes, so double-check it
                        </p>
                    </CardFooter>
                </div>

                {/* Signup Form */}
                <div style={{gridArea: 'card-content'}} className={cn("w-full flex-shrink-0 transition-opacity duration-300", isLoginView && "opacity-0 pointer-events-none")}>
                    <CardHeader className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Image src="https://i.postimg.cc/3NNnNB5C/LOGO-AIRTRACK.png" alt="AirTrack Logo" width={240} height={240} className="object-contain" />
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
                        <form onSubmit={handleSignup} className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="signup-name">Name</Label>
                                <Input id="signup-name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required className="bg-white/10 border-white/20 placeholder:text-white/60" suppressHydrationWarning />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-email">Email</Label>
                                <Input id="signup-email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/10 border-white/20 placeholder:text-white/60"/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-password">Password</Label>
                                <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="bg-white/10 border-white/20 placeholder:text-white/60"/>
                            </div>
                            <Button type="submit" className="w-full transition-all hover:scale-105 active:bg-gradient-to-r active:from-pink-500 active:via-purple-500 active:to-blue-500" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign Up
                            </Button>
                        </form>
                        <div className="relative my-3">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/20" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card/10 px-2 text-white/60">Or continue with</span>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full text-white bg-white/10 border-white/20 hover:bg-white/20" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
                            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                            Sign up with Google
                        </Button>
                    </CardContent>
                    <CardFooter className="flex-col items-center justify-center text-center text-sm pt-3 pb-4">
                        <p className="mb-2">Already have an account?{" "}
                            <button onClick={toggleView} className="underline hover:text-primary">Log in</button>
                        </p>
                        <p className="text-center text-xs text-white/60">
                            Deep Learning Agentic AI developed by STD.DATABASE.Ai<br />
                            TnC AI can make mistakes, so double-check it
                        </p>
                    </CardFooter>
                </div>
            </div>
        </Card>
        <StatusIndicator className="w-full max-w-sm" />
      </div>
    </main>
  );

    
