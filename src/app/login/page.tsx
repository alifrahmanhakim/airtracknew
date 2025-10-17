
'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plane, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
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
import { Checkbox } from '@/components/ui/checkbox';

const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const AppleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
        <path d="M12.152,5.275c-1.357,0-2.648-0.803-3.46-2.015c-0.88-1.31-2.113-2.338-3.428-2.338 c-1.47,0-2.92,0.88-3.739,2.211c-1.223,2.02-1.93,4.537-1.93,6.969c0,2.304,0.695,4.789,1.93,6.84 c0.819,1.33,2.269,2.21,3.739,2.21c1.315,0,2.548-1.028,3.428-2.338c0.812-1.212,2.103-2.015,3.46-2.015 c1.357,0,2.648,0.803,3.46,2.015c0.88,1.31,2.113,2.338,3.428,2.338c1.47,0,2.92-0.88,3.739-2.211 c1.223-2.02,1.93-4.537,1.93-6.969c0-2.304-0.695-4.789-1.93-6.84c-0.819-1.33-2.269-2.21-3.739-2.21 c-1.315,0-2.548,1.028-3.428,2.338C14.799,4.472,13.509,5.275,12.152,5.275z M10.45,4.258 c-0.039,0.027-0.076,0.054-0.115,0.082C9.4,4.86,8.512,5.7,8.512,6.953c0,1.48,1.203,2.703,2.73,2.703 c0.043,0,0.086-0.002,0.129-0.005c-0.03-0.02-0.059-0.04-0.088-0.06C10.368,9.07,9.356,8.19,9.356,7.018 C9.356,5.556,10.531,4.35,12.03,4.35c0.016,0,0.03,0.002,0.045,0.003C11.516,4.024,10.975,4.032,10.45,4.258z" />
    </svg>
);


export default function LoginPage() {
  const router = useRouter();
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSuccessfullLogin = (userId: string) => {
    localStorage.setItem('loggedInUserId', userId);
    router.push('/my-dashboard');
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
            const userData = userSnap.data() as User;
            if (!userData.isApproved) {
                await signOut(auth);
                setError("Your account is pending approval by an administrator. Please check back later.");
                setIsGoogleLoading(false);
                return;
            }
            handleSuccessfullLogin(firebaseUser.uid);
        } else {
            const newUser: Omit<User, 'id'> = {
                name: firebaseUser.displayName || 'Google User',
                email: firebaseUser.email,
                avatarUrl: firebaseUser.photoURL || `https://placehold.co/100x100.png`,
                role: 'Functional',
                department: 'Pegawai STD',
                isApproved: false,
            };
            await setDoc(userRef, newUser);
            await signOut(auth);
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
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSignupSuccess(false);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const fullName = `${firstName} ${lastName}`.trim();
      await updateProfile(firebaseUser, { displayName: fullName });

      const newUser: Omit<User, 'id'> = {
        name: fullName,
        email: email,
        avatarUrl: `https://placehold.co/100x100.png`,
        role: 'Functional',
        department: 'Pegawai STD',
        isApproved: false,
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      
      setSignupSuccess(true);
      setIsLoginView(true);
      setFirstName('');
      setLastName('');
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
    setPassword('');
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-4 md:p-8 login-background">
      <div className="login-grid animate-in fade-in slide-in-from-left-24 duration-1000">
        {/* Left Side */}
        <div className="hidden md:flex flex-col justify-between p-8 bg-black/30 relative overflow-hidden rounded-l-3xl">
            <Image
                src="https://i.postimg.cc/Jr505JMg/shiny-metallic-engine-propeller-turning-workshop-generated-by-ai.webp"
                alt="Aircraft engine"
                fill
                className="object-cover z-0"
            />
             <div className="absolute inset-0 bg-black/40 z-10"></div>
          <div className="z-20">
              <Image src="https://i.postimg.cc/3NNnNB5C/LOGO-AIRTRACK.png" alt="AirTrack Logo" width={100} height={25} />
          </div>
          <div className="text-white z-20">
            <h2 className="text-4xl font-bold">Aviation Safety</h2>
            <h2 className="text-4xl font-bold">Starts Here</h2>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex flex-col justify-center p-8 sm:p-12 bg-black/30 backdrop-blur-lg rounded-r-3xl">
            {isLoginView ? (
                // Login View
                <div>
                    <h1 className="text-3xl font-bold text-white">Login</h1>
                    <p className="text-sm text-white/70 mt-2">
                        Don't have an account?{' '}
                        <button onClick={toggleView} className="font-semibold text-primary hover:underline">
                            Create account
                        </button>
                    </p>
                    {signupSuccess && (
                        <Alert variant="default" className="mt-6 bg-green-500/20 border-green-500/50 text-green-300">
                            <CheckCircle className="h-4 w-4 !text-green-400" />
                            <AlertTitle className="text-green-300 font-bold">Registration Successful!</AlertTitle>
                            <AlertDescription className="text-green-400">
                                Your account has been created. Please wait for an administrator to approve it.
                            </AlertDescription>
                        </Alert>
                    )}
                     {error && <Alert variant="destructive" className="mt-6"><AlertTitle>Login Failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                    <form onSubmit={handleLogin} className="space-y-6 mt-8">
                        <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <Input id="login-email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="login-password">Password</Label>
                             <div className="relative">
                                <Input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-white/70" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff /> : <Eye />}
                                </Button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full !mt-8" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Login
                        </Button>
                    </form>
                </div>
            ) : (
                // Signup View
                <div>
                    <h1 className="text-3xl font-bold text-white">Create an account</h1>
                    <p className="text-sm text-white/70 mt-2">
                        Already have an account?{' '}
                        <button onClick={toggleView} className="font-semibold text-primary hover:underline">
                            Log in
                        </button>
                    </p>
                     {error && <Alert variant="destructive" className="mt-6"><AlertTitle>Signup Failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                    <form onSubmit={handleSignup} className="space-y-4 mt-6">
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="signup-firstname">First Name</Label>
                                <Input id="signup-firstname" type="text" placeholder="Fletcher" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="signup-lastname">Last Name</Label>
                                <Input id="signup-lastname" type="text" placeholder="Donohue" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="signup-email">Email</Label>
                            <Input id="signup-email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="signup-password">Password</Label>
                            <div className="relative">
                                <Input id="signup-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-white/70" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff /> : <Eye />}
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="terms" required />
                            <label htmlFor="terms" className="text-sm text-white/70 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                I agree to the <a href="#" className="underline text-white hover:text-primary">Terms & Conditions</a>
                            </label>
                        </div>
                        <Button type="submit" className="w-full !mt-6" disabled={isLoading}>
                           {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create account
                        </Button>
                    </form>
                </div>
            )}
             <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-white/60">Or register with</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <Button variant="outline" className="w-full bg-white/10 border-white/20 hover:bg-white/20 text-white" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
                    {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                    Google
                </Button>
                 <Button variant="outline" className="w-full bg-white/10 border-white/20 hover:bg-white/20 text-white" disabled>
                    <AppleIcon />
                    Apple
                </Button>
            </div>
        </div>
      </div>
    </main>
  );
}

    