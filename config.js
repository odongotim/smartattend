// config.js
const firebaseConfig = {
    apiKey: "AIzaSyB0n1GiqGllPKRAKgz9lEgt-6Ac6Jc4MWU",
    authDomain: "scanattend-c07f6.firebaseapp.com",
    projectId: "scanattend-c07f6",
    storageBucket: "scanattend-c07f6.firebasestorage.app",
    messagingSenderId: "352653349762",
    appId: "1:352653349762:web:848065fdb26803f594359b"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Export variables to the global window object so login.js can see them
const auth = firebase.auth();
const db = firebase.firestore();