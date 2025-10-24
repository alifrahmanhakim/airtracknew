
'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Loader2, CheckCircle, Eye, EyeOff, AlertTriangle, Mail, Sparkles } from "lucide-react";
import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StatusIndicator } from '@/components/status-indicator';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import { TermsAndConditionsDialog } from '@/components/terms-and-conditions-dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordReset } from '@/lib/actions/user';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const loginBackgroundImage = 'https://ik.imagekit.io/avmxsiusm/green-plane-ecofriendly-environment%20(1).jpg';

const quoteSlides = [
    { text: "The engine is the heart of an airplane, but the pilot is its soul.", author: "Walter Raleigh" },
    { text: "To invent an airplane is nothing. To build one is something. But to fly is everything.", author: "Otto Lilienthal" },
    { text: "The future of aviation is not in the data.", author: "Modern Proverb" },
    { text: "Safety is not an intellectual exercise to keep us in work. It is a practical and emotional issue. It is about our lives.", author: "Sir Jackie Stewart" }
];

const cardBackgroundImages = [
    'https://ik.imagekit.io/avmxsiusm/airplane-runway%20(1).jpg',
    'https://ik.imagekit.io/avmxsiusm/shiny-metallic-engine-propeller-turning-workshop-generated-by-ai%20(1).jpg',
    'https://ik.imagekit.io/avmxsiusm/drones-futuristic-cityscape-sunset%20(1).jpg',
];


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoginView, setIsLoginView] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [showResetSuccessDialog, setShowResetSuccessDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentCardImageIndex, setCurrentCardImageIndex] = useState(0);
  
  
  useEffect(() => {
    const loggedInUserId = localStorage.getItem('loggedInUserId');
    if (loggedInUserId) {
        router.push('/my-dashboard');
    } else {
        setIsCheckingAuth(true);
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setTimeout(() => setIsCheckingAuth(false), 300);
                    return 100;
                }
                const increment = Math.random() * 20; // Increased increment
                return Math.min(prev + increment, 100);
            });
        }, 15); // Faster interval

        return () => clearInterval(timer);
    }
  }, [router]);

  useEffect(() => {
    setCurrentQuoteIndex(Math.floor(Math.random() * quoteSlides.length));

    const imageSlideInterval = setInterval(() => {
        setCurrentCardImageIndex(prev => (prev + 1) % cardBackgroundImages.length);
    }, 5000);
    return () => clearInterval(imageSlideInterval);
  }, []);

  const handleSuccessfullLogin = (userId: string) => {
    localStorage.setItem('loggedInUserId', userId);
    router.push('/my-dashboard');
  };
  
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');
    setSignupSuccess(false);

    try {
        const { db, auth, googleProvider } = await import('@/lib/firebase');
        const { signInWithPopup, signOut } = await import('firebase/auth');
        const { doc, getDoc, setDoc, updateDoc } = await import('firebase/firestore');

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
             const updates: Partial<User> = {};
            if (firebaseUser.photoURL && userData.avatarUrl !== firebaseUser.photoURL) {
                updates.avatarUrl = firebaseUser.photoURL;
            }
            if (firebaseUser.displayName && userData.name !== firebaseUser.displayName) {
                updates.name = firebaseUser.displayName;
            }

            if (Object.keys(updates).length > 0) {
                await updateDoc(userRef, updates);
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
      const { db, auth } = await import('@/lib/firebase');
      const { signInWithEmailAndPassword, signOut } = await import('firebase/auth');
      const { doc, getDoc } = await import('firebase/firestore');

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
    if (!termsAccepted) {
        setError("You must agree to the Terms & Conditions to create an account.");
        return;
    }
    setIsSubmitting(true);
    setError('');
    setSignupSuccess(false);

    try {
      const { db, auth } = await import('@/lib/firebase');
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const { doc, setDoc } = await import('firebase/firestore');

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
      setTermsAccepted(false);

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
  
  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Email Required',
        description: 'Please enter your email address to reset your password.',
      });
      return;
    }

    setIsSendingReset(true);
    const result = await sendPasswordReset(email);
    setIsSendingReset(false);

    if (result.success) {
      setResetEmail(email);
      setShowResetSuccessDialog(true);
    } else {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError('');
    setSignupSuccess(false);
    setPassword('');
  }

  return (
    <main className="relative flex items-center justify-center min-h-screen p-4 md:p-8 overflow-hidden">
        <Image
            src={loginBackgroundImage}
            alt="Background"
            fill
            sizes="100vw"
            className="object-cover -z-10"
            quality={75}
            priority
        />
        <div className="absolute inset-0 bg-black/30 -z-10" />

        <div className="relative group login-grid">
         <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-green-500 rounded-3xl blur opacity-0 group-hover:opacity-75 transition duration-1000 animate-gradient-move"></div>
          {/* Left Side */}
          <div className="relative hidden md:flex flex-col justify-between p-8 rounded-l-3xl overflow-hidden">
             <div className="absolute inset-0 z-0">
                 {cardBackgroundImages.map((src, index) => (
                    <Image
                        key={src}
                        src={src}
                        alt="Aircraft slideshow"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        quality={75}
                        priority={index === 0}
                        className={cn("object-cover transition-opacity duration-1000",
                            index === currentCardImageIndex ? 'opacity-100' : 'opacity-0'
                        )}
                    />
                ))}
            </div>
            <div className="absolute inset-0 bg-black/40 z-10 rounded-l-3xl"></div>
            <div className="z-20">
                <Image src="https://i.postimg.cc/3NNnNB5C/LOGO-AIRTRACK.png" alt="AirTrack Logo" width={97} height={24} style={{ width: 'auto', height: 'auto' }} />
            </div>
             <div className="z-20">
              <h2 className="text-2xl font-semibold text-white">{quoteSlides[currentQuoteIndex].text}</h2>
              <p className="text-right mt-2 font-medium text-white/80">- {quoteSlides[currentQuoteIndex].author}</p>
            </div>
          </div>

          {/* Right Side */}
          <div className="relative flex flex-col justify-center p-8 sm:p-12 bg-card/60 backdrop-blur-sm rounded-3xl md:rounded-l-none">
            <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-full blur-sm opacity-50 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                    <Button asChild variant="ghost" size="icon" className="relative animate-pulse">
                        <Link href="/whats-new">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            <span className="sr-only">What's New</span>
                        </Link>
                    </Button>
                </div>
                <ThemeToggle />
            </div>
            <div className='flex-grow flex flex-col justify-center'>
                {isCheckingAuth && (
                    <Card className="absolute inset-0 flex flex-col items-center justify-center bg-yellow-50/80 dark:bg-yellow-950/80 backdrop-blur-sm rounded-3xl md:rounded-l-none z-30 animate-fade-in-blur">
                        <CardHeader className="text-center items-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 mb-2">
                                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                            </div>
                            <CardTitle className="text-yellow-900 dark:text-yellow-200">Connecting to AirTrack</CardTitle>
                            <CardDescription className="text-yellow-800 dark:text-yellow-300">Authenticating session and connecting to servers.</CardDescription>
                        </CardHeader>
                        <CardContent className="w-full max-w-xs text-center">
                             <Progress value={progress} className="h-2" indicatorClassName="bg-yellow-500" />
                             <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-2">{Math.round(progress)}%</p>
                        </CardContent>
                    </Card>
                )}
              <div key={isLoginView ? 'login' : 'signup'} className="animate-fade-in-blur">
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
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="login-password">Password</Label>
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="h-auto p-0 text-xs"
                                            onClick={handleForgotPassword}
                                            disabled={isSendingReset}
                                        >
                                            {isSendingReset ? (
                                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                            ) : null}
                                            Forgot password?
                                        </Button>
                                    </div>
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
                              <div className="mt-6 flex justify-center">
                                <StatusIndicator variant="icon" />
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
                                <TermsAndConditionsDialog
                                    checked={termsAccepted}
                                    onCheckedChange={setTermsAccepted}
                                />
                                <Button type="submit" className="w-full !mt-6" disabled={isSubmitting || !termsAccepted}>
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
                               <div className="mt-6 flex justify-center">
                                <StatusIndicator variant="icon" />
                              </div>
                          </div>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <AlertDialog open={showResetSuccessDialog} onOpenChange={setShowResetSuccessDialog}>
            <AlertDialogContent>
                <AlertDialogHeader className="text-center items-center">
                     <Image src="https://ik.imagekit.io/avmxsiusm/IMG_6912.png" alt="Email sent" width={80} height={80} className="mb-4" />
                    <AlertDialogTitle className='flex items-center gap-2'><Mail className='h-5 w-5' />Password Reset Email Sent</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-muted-foreground text-center">
                        An email has been sent to <span className="font-semibold">{resetEmail}</span> with instructions to reset your password.
                        <br /><br />
                        The email is sent from <span className="font-semibold">itdesk@stdatabase.site</span>.
                        <br /><br />
                        <strong className="text-red-500">Please also check your spam folder.</strong>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setShowResetSuccessDialog(false)}>
                        Close
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </main>
  );
}
