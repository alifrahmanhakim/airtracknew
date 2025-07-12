
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
    <main className="flex items-center justify-center min-h-screen bg-cover bg-center p-4" style={{backgroundImage: "url('https://lh3.googleusercontent.com/fife/ALs6j_HEz1NqrMGKXdij_NjWASvJupzN1f_5X5_wt4b2bl-qBlHrvJVbenq-l-yVgUkuW1tLrT3javAJ0NwrMSC_NETsiyeXsUIEbIw2NyTwGseBgXi5Ma7ygv-gBKmA4rf9fSbi7TLXwyCVdWzaZFUDQJK0-x9CwznjeZ-Ypq7ye-XxNNt1Kti7b3ZsGUeUhIDsjZfQliXbhVA3189GcNcq6KORqpc-oO4adMgXy5MKNsrLydBOpfOLVhugPy9jBAwtPNv6B8wRLFOGV3LIP5mxEUAu3P-0SVjmz_rjpV1GJrWjG-30L8MkpMHX_cnAC-Lcyx_gJOOvpYkPQOhvKSW6_2GNLkl2M7kwu5kr3WxzDLGTg_7PVIY2PQfKS8bA1Q9SDUBYp3YVHGo_XMoLfgShdNyQ4n7g6tOumdjSDIKWvnZWxbFxvYoHHfdDx8UywWVA-JpA0so-ztQucEPTJyO67gqvS3CV7j5qzNWxa3TUvSWsyd37afGzXQwdhtuC7cLuFH7KMdnG8LLi8PKRJDVNAQysjGCyK9Sk_5oCMM69doD4iweOtZCFoV44hdk8edEXW2gQ_8WGK-NcD_nXBMa6poVN2dMUw-lSKX0Hgh2jlvxCit6jC3IBPuhjYbLSgA_S56cvqBbTMy-LoH0yLLGQbdJP7CTVlTlihPBvwGob-qLziz2iaa1ihA_Ac_l48nEvDyjdbSlKUldpcy9IvIjf0-u0Z6K-3AnmdBg-DisLfvRpZRH1JzfJojG1LDpU4Jn3ty_8xkUKLoe4EuirHV9pGUTdi7tnjTrX7cXbIjFjYzX96rVrLuAr0_9mQAkk3bK3gGYkUzPAXZniuwayhY8xYDZWZO4wqMg2_jLL1CbNnOmxYVs6MyAaja3qdrW_WlS52_x5NhLWl_R1-rw2TrY0ayDA7lmuxtwAdEauAq2_n8PQQjjd1N_J8Ttm7Pai0O-bmHVFcWru_tp75wBAjt0cXfYEQYA08DCdnnh6lPP-T7FrcVTxaSiN2NfM_uZwyBW9j4p0LJTyvUyOCjqzgeX69O0PV9pJM7OrV6k_Q_AId1MIOYRymFjBk8zt3FfaU8UW-6hL5edWKg2yWZDt_ajukftgRTEr4Wyv6RGDWa7uKNWtoB0dkwMu2AjmIeUlPXIw9ddoU89t2o1vajdOWd_4J-IprrLAjP4m5dqGgO3eN6uXEdC1G9hZxUQ_rxdybIiybPYRNFNvY_gGilTzFiafLBwgzmoy7nepwDUqjRnJsoayqY1a-15M0laXNVj_-3GRt0lXhW2mkyOTAPyd5j-U2XU_3EVs-Rok_E3JheEJT4Z76TSVuqQlHNkJ1dDk5MQwVmfrWJk6ysG2SIKFhvGoMGP0vP_FW57TfDPt_XiKsuAGmfDqKTSGbHE6ZHFtLFDuV0V40jPlL7Mko2y3Q_pBnbkYPqwzBof3sGy_EsAcrCZ8KfFxm9I-rvXSDQs=s1024')"} }>
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
