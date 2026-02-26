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
    const user = firebase.auth().currentUser;

    if (!user) {
        alert("❌ You are not logged in!");
        return;
    }

    try {
        // 1. Fetch the official data from the 'users' collection using UID
        const userDoc = await db.collection("users").doc(user.uid).get();

        if (!userDoc.exists) {
            alert("❌ Registration record not found!");
            return;
        }

        const userData = userDoc.data();
        const today = new Date().toISOString().split('T')[0]; 
        
        // 2. Create a unique Document ID for this specific scan
        // This avoids creating sub-collections and keeps data at the top level
        const docId = `${userData.regNo.replace(/\//g, "_")}_${today}`;
        const docRef = db.collection("attendance").doc(docId);

        // 3. Save the information as FIELDS (not sub-collections)
        await docRef.set({
            name: userData.name,          // From 'users' collection
            email: userData.email,        // From 'users' collection
            regNo: userData.regNo,        // From 'users' collection
            session: sessionName,         // The QR code data
            date: today,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Play sound and update UI
        document.getElementById("beepSound").play();
        document.getElementById("result").innerText = `Attendance Marked: ${userData.name}`;
        document.getElementById("result").style.color = "red";

    } catch (err) {
        console.error("Error writing to Firestore:", err);
        alert("❌ Database Error: " + err.message);
        hasMarked = false; // Allow retry on error
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