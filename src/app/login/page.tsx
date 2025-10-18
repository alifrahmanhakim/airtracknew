
'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plane, Loader2, CheckCircle, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useState, useEffect } from 'react';
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
import { TermsAndConditionsDialog } from '@/components/terms-and-conditions-dialog';
import { Progress } from '@/components/ui/progress';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loggedInUserId = localStorage.getItem('loggedInUserId');
    if (loggedInUserId) {
        router.push('/my-dashboard');
    } else {
        setIsCheckingAuth(true); // Start "loading"
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) {
                    clearInterval(timer);
                    return 95;
                }
                return prev + 10;
            })
        }, 200);

        setTimeout(() => {
            clearInterval(timer);
            setProgress(100);
            setTimeout(() => setIsCheckingAuth(false), 300); // End "loading"
        }, 2000);
        
        return () => clearInterval(timer);
    }
  }, [router]);

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
    if (!email || !password) {
        setError("Please enter both email and password.");
        return;
    }
    setIsSubmitting(true);
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
          setIsSubmitting(false);
          return;
      }

      const userData = userSnap.data() as User;

      if (!userData.isApproved) {
          await signOut(auth);
          setError("Your account is pending approval by an administrator. Please check back later.");
          setIsSubmitting(false);
          return;
      }

      handleSuccessfullLogin(userSnap.id);

    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email') {
        setError("Invalid email or password. Please try again.");
      } else {
        setError("An error occurred during login. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
     if (!fullName || !email || !password) {
        setError("Please fill out all required fields.");
        return;
    }
    setIsSubmitting(true);
    setError('');
    setSignupSuccess(false);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
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
      setFullName('');
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
        setIsSubmitting(false);
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError('');
    setSignupSuccess(false);
    setPassword('');
  }

  return (
    <>
      <main className="flex items-center justify-center min-h-screen p-4 md:p-8 login-background">
        <div className="relative group login-grid">
         <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-green-500 rounded-3xl blur opacity-0 group-hover:opacity-75 transition duration-1000 animate-gradient-move"></div>
          {/* Left Side */}
          <div
              className="relative hidden md:flex flex-col justify-between p-8 rounded-l-3xl bg-cover bg-center login-background-alt"
          >
               <div className="absolute inset-0 bg-black/40 z-10 rounded-l-3xl"></div>
            <div className="z-20">
                <Image src="https://i.postimg.cc/3NNnNB5C/LOGO-AIRTRACK.png" alt="AirTrack Logo" width={180} height={48} className="object-contain" />
            </div>
            <div className="text-white z-20">
              <h2 className="text-4xl font-bold">Aviation Safety</h2>
              <h2 className="text-4xl font-bold">Starts Here</h2>
            </div>
          </div>

          {/* Right Side */}
          <div className="relative flex flex-col justify-center p-8 sm:p-12 bg-card/60 backdrop-blur-sm rounded-r-3xl">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <div className='flex-grow flex flex-col justify-center'>
              <div key={isLoginView ? 'login' : 'signup'} className="animate-in fade-in duration-500">
                {isLoginView ? (
                    // Login View
                    <div className="h-full flex flex-col">
                        <div className="flex-grow">
                            <Image src="https://i.postimg.cc/6qPgDcy2/faviconairtrack.png" alt="AirTrack Logo" width={50} height={50} className="object-contain mb-4" />
                            <h1 className="text-3xl font-bold">Login</h1>
                            <p className="text-sm text-muted-foreground mt-2">
                                Don't have an account?{' '}
                                <button onClick={toggleView} className="font-semibold text-primary hover:underline" disabled={isCheckingAuth}>
                                    Create account
                                </button>
                            </p>
                            {isCheckingAuth && (
                                  <Alert variant="default" className="mt-6 bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700/50 dark:text-yellow-300">
                                      <AlertTriangle className="h-4 w-4 !text-yellow-500" />
                                      <AlertTitle className="font-bold">Connecting</AlertTitle>
                                      <AlertDescription>
                                          Please wait, we are checking your session. Do not enter credentials until this message disappears.
                                          <Progress value={progress} className="mt-2 h-1" />
                                      </AlertDescription>
                                  </Alert>
                              )}
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
                                    <Input id="login-email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSubmitting || isCheckingAuth} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="login-password">Password</Label>
                                    <div className="relative">
                                        <Input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={isSubmitting || isCheckingAuth} />
                                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff /> : <Eye />}
                                        </Button>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full !mt-8" disabled={isSubmitting || isCheckingAuth}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Login
                                </Button>
                            </form>
                        </div>
                        <div className="mt-auto pt-6">
                              <div className="relative my-6">
                                  <div className="absolute inset-0 flex items-center">
                                      <span className="w-full border-t border-border" />
                                  </div>
                                  <div className="relative flex justify-center text-xs uppercase">
                                      <span className="bg-card/60 px-2 text-muted-foreground">Or register with</span>
                                  </div>
                              </div>
                              <div className="grid grid-cols-1 gap-4">
                                  <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isCheckingAuth}>
                                      {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                                      Google
                                  </Button>
                              </div>
                          </div>
                    </div>
                ) : (
                    // Signup View
                    <div className="h-full flex flex-col">
                        <div className="flex-grow">
                            <Image src="https://i.postimg.cc/6qPgDcy2/faviconairtrack.png" alt="AirTrack Logo" width={50} height={50} className="object-contain mb-4" />
                            <h1 className="text-3xl font-bold">Create an account</h1>
                            <p className="text-sm text-muted-foreground mt-2">
                                Already have an account?{' '}
                                <button onClick={toggleView} className="font-semibold text-primary hover:underline">
                                    Log in
                                </button>
                            </p>
                            {error && <Alert variant="destructive" className="mt-6"><AlertTitle>Signup Failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                            <form onSubmit={handleSignup} className="space-y-4 mt-6">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-fullname">Full Name</Label>
                                    <Input id="signup-fullname" type="text" placeholder="Fletcher Donohue" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={isSubmitting} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email">Email</Label>
                                    <Input id="signup-email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSubmitting} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">Password</Label>
                                    <div className="relative">
                                        <Input id="signup-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={isSubmitting} />
                                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff /> : <Eye />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="items-top flex space-x-3 pt-2">
                                    <Checkbox id="terms" required disabled={isSubmitting} />
                                    <div className="grid gap-1.5 leading-none">
                                        <label
                                            htmlFor="terms"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            I agree to the{' '}
                                            <TermsAndConditionsDialog />
                                        </label>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full !mt-6" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create account
                                </Button>
                            </form>
                        </div>
                          <div className="mt-auto pt-6">
                              <div className="relative my-6">
                                  <div className="absolute inset-0 flex items-center">
                                      <span className="w-full border-t border-border" />
                                  </div>
                                  <div className="relative flex justify-center text-xs uppercase">
                                      <span className="bg-card/60 px-2 text-muted-foreground">Or register with</span>
                                  </div>
                              </div>
                              <div className="grid grid-cols-1 gap-4">
                                  <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
                                      {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                                      Google
                                  </Button>
                              </div>
                          </div>
                    </div>
                )}
              </div>
            </div>
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 p-2 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
                <StatusIndicator variant="icon" />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
