
'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plane } from "lucide-react";
import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Password field is kept for UI, but not used in logic
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!email) {
        setError("Please enter an email address.");
        setIsLoading(false);
        return;
      }
      
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("No user found with this email. Please try chewyhusky@gmail.com or another valid user email.");
        setIsLoading(false);
        return;
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = { id: userDoc.id, ...userDoc.data() } as User;

      // In a real app, you'd also verify the password.
      // Here, we'll just check if the user exists.
      localStorage.setItem('loggedInUserId', userData.id);
      
      // Use window.location.href for a full page reload to ensure server-side rendering picks up the new session
      window.location.href = '/dashboard';

    } catch (err) {
      console.error("Login Error:", err);
      setError("An error occurred during login. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm animate-in fade-in-0 zoom-in-95 duration-500">
        <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground">
                    <Plane className="h-6 w-6" />
                </div>
            </div>
          <CardTitle className="text-2xl">AirTrack Login</CardTitle>
          <CardDescription>
            Enter any valid user email to log in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="chewysihusky@gmail.com" 
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
                placeholder="any password"
                required
              />
            </div>
            
            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button type="submit" className="w-full transition-transform hover:scale-105" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
