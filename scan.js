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
    // ... (fetch userDoc logic from previous steps) ...

    const userData = userDoc.data();
    const today = new Date().toISOString().split('T')[0]; 
    
    // Unique ID: RegNo + Session + Date (Prevents double scanning for same class)
    const docId = `${userData.regNo}_${sessionName}_${today}`;
    const docRef = db.collection("attendance").doc(docId);

    await docRef.set({
        name: userData.name,
        regNo: userData.regNo,
        email: userData.email,
        session: sessionName, // Store which class they scanned for
        date: today,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    document.getElementById("result").innerText = `✅ Verified for ${sessionName}`;
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