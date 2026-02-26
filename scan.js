// --- Global Variables ---
const html5QrCode = new Html5Qrcode("reader");
let cameras = [];
let currentCameraIndex = 0;
let isSwitching = false;
let hasMarked = false;

// --- 1. Camera Logic ---

// Get all cameras and start the default one
Html5Qrcode.getCameras().then(camList => {
    if (camList && camList.length) {
        cameras = camList;
        // Try to find back camera first, otherwise use the first one available
        const backCamIndex = camList.findIndex(c => 
            c.label.toLowerCase().includes("back") || 
            c.label.toLowerCase().includes("rear")
        );
        currentCameraIndex = backCamIndex >= 0 ? backCamIndex : 0;
        startCamera(currentCameraIndex);
    } else {
        alert("No cameras found on this device.");
    }
}).catch(err => console.error("Error getting cameras:", err));

function startCamera(index) {
    if (!cameras || cameras.length === 0) return;

    html5QrCode.start(
        cameras[index].id,
        { 
            fps: 15,          // Higher FPS for faster detection
            qrbox: { width: 300, height: 300 }, // Larger scan area for distance
            aspectRatio: 1.0  // Square focus
        },
        onScanSuccess,
        errorMessage => { /* Scan noise */ }
    ).catch(err => console.error("Camera error:", err));
}

async function switchCamera() {
    if (cameras.length < 2 || isSwitching) return;
    
    isSwitching = true;
    currentCameraIndex = (currentCameraIndex + 1) % cameras.length;

    try {
        // MUST stop the current scanner before starting a new one
        if (html5QrCode.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
            await html5QrCode.stop();
        }
        await startCamera(currentCameraIndex);
    } catch (err) {
        console.error("Error during camera switch:", err);
    } finally {
        isSwitching = false;
    }
}

// --- 2. Attendance Logic ---

async function markAttendance(sessionName) {
    console.log("Step 1: Starting attendance for session:", sessionName);
    const user = firebase.auth().currentUser;

    if (!user) {
        console.error("No user found in Firebase Auth");
        alert("❌ Auth Error: You are not logged in!");
        return;
    }

    try {
        document.getElementById("result").innerText = "⏳ Verifying your profile...";
        
        // Step 2: Fetch from 'users' collection
        console.log("Step 2: Fetching UID:", user.uid);
        const userDoc = await db.collection("users").doc(user.uid).get();

        if (!userDoc.exists) {
            console.error("User document missing in Firestore 'users' collection");
            document.getElementById("result").innerText = "❌ Profile not found in database!";
            alert("Your account is not registered in the 'users' collection.");
            hasMarked = false; // Reset so they can try again
            return;
        }

        const userData = userDoc.data();
        console.log("Step 3: User data found:", userData);

        const today = new Date().toISOString().split('T')[0]; 
        const docId = `${userData.regNo}_${sessionName}_${today}`;
        
        // Step 4: Write to 'attendance'
        await db.collection("attendance").doc(docId).set({
            name: userData.name || "Unknown",
            regNo: userData.regNo || "N/A",
            email: userData.email || user.email,
            session: sessionName,
            date: today,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log("Step 5: Successfully written to database!");
        document.getElementById("result").innerText = `✅ Success! Marked for ${userData.name}`;
        document.getElementById("result").style.color = "green";

    } catch (err) {
        console.error("CRITICAL ERROR:", err);
        document.getElementById("result").innerText = "❌ Database Error!";
        alert("Firestore Error: " + err.message);
        hasMarked = false;
    }
}

function onScanSuccess(decodedText) {
    console.log("Raw Scanned Data:", decodedText);
    
    // 1. Prevent multiple scans while processing
    if (hasMarked) return;

    let sessionName = decodedText;
    let qrTimestamp = null;

    // 2. Validation Logic (SessionName|Timestamp)
    if (decodedText.includes('|')) {
        const parts = decodedText.split('|');
        sessionName = parts[0];
        qrTimestamp = parseInt(parts[1]);

        const currentTime = Date.now();
        const expiryLimit = 30 * 60 * 1000; // 30 Minutes

        if (currentTime - qrTimestamp > expiryLimit) {
            document.getElementById("result").innerText = "❌ QR Code Expired!";
            document.getElementById("result").style.color = "red";
            return; 
        }
    }

    // 3. Play Success Sound
    const audio = document.getElementById("beepSound");
    if (audio) {
        audio.play().catch(e => console.log("Audio play blocked by browser:", e));
    }

    // 4. Proceed to Firebase
    hasMarked = true;
    markAttendance(sessionName);
}

function logout() {
    localStorage.clear();
    firebase.auth().signOut().then(() => { window.location.href = "login.html"; });
}