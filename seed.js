
// This script is NOT part of the application runtime.
// It is a utility script to seed the Firestore database with initial data.
// To use it, run `npm run seed` from your terminal.

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

// IMPORTANT: This configuration is now aligned with your actual Firebase config from src/lib/firebase.ts
const firebaseConfig = {
    apiKey: "AIzaSyCVT1PDkGdczXUP_LatsS6Q4K1h0xvXeT0",
    authDomain: "aoc-insight.firebaseapp.com",
    projectId: "aoc-insight",
    storageBucket: "aoc-insight.appspot.com",
    messagingSenderId: "795850632942",
    appId: "1:795850632942:web:e780d8191316b17c8651a8",
    measurementId: "G-CNFZC766E2"
};


// These are the static users from src/lib/data.ts
const users = [
    { id: 'admin-00', name: 'Admin User', email: 'admin@admin2023.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'Sub-Directorate Head', isApproved: true },
    { id: 'admin-01', name: 'Hakim Alif Rahman', email: 'hakimalifrahman@gmail.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'Sub-Directorate Head', isApproved: true },
    { id: '8aOs7OSaL8XFXLq7DxzbnuXN5eC3', name: 'Chewy Sihusky', email: 'chewysihusky@gmail.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'Sub-Directorate Head' },
    { id: 'user-1', name: 'Alex Johnson', email: 'alex.johnson@example.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'Team Lead' },
    { id: 'user-2', name: 'Maria Garcia', email: 'maria.garcia@example.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'PIC' },
    { id: 'user-3', name: 'James Smith', email: 'james.smith@example.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'PIC Assistant' },
    { id: 'user-4', name: 'Patricia Williams', email: 'patricia.williams@example.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'Functional' },
];


async function seedDatabase() {
    try {
        console.log('Initializing Firebase...');
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        console.log('Firebase initialized.');

        console.log('Starting to seed users...');
        const usersCollection = collection(db, 'users');
        
        const promises = users.map(user => {
            // We use the user's `id` from the static data as the document ID in Firestore
            const userRef = doc(usersCollection, user.id);
            // The data to be set is the user object, but we don't need to store the id inside the document itself
            const { id, ...userData } = user;
            console.log(`Preparing to set user: ${user.email} with ID: ${user.id}`);
            return setDoc(userRef, userData, { merge: true }); // Use merge:true to avoid overwriting existing fields if any
        });

        await Promise.all(promises);

        console.log('=============================================');
        console.log('✅ Seeding completed successfully!');
        console.log(`${users.length} users have been added or updated in the 'users' collection.`);
        console.log('=============================================');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1); // Exit with an error code
    }
}

seedDatabase().then(() => {
    // Firebase needs some time to close connections, so we'll wait a bit
    setTimeout(() => process.exit(0), 1000);
}).catch(() => {
    setTimeout(() => process.exit(1), 1000);
});
