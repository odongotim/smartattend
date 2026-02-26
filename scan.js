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

async function startCamera(index) {
    const cameraId = cameras[index].id;
    try {
        await html5QrCode.start(
            cameraId,
            { fps: 10, qrbox: { width: 250, height: 250 } },
            onScanSuccess,
            (errorMessage) => { /* ignore scan noise */ }
        );
    } catch (err) {
        console.error("Unable to start camera:", err);
    }
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
    if (hasMarked) return;

    // 1. Split the data (SessionName|Timestamp)
    const parts = decodedText.split('|');
    if (parts.length < 2) {
        alert("❌ Invalid QR Code format.");
        return;
    }

    const sessionName = parts[0];
    const qrTimestamp = parseInt(parts[1]);
    const currentTime = Date.now();

    // 2. Define Validation Period (e.g., 30 minutes in milliseconds)
    // 30 mins * 60 secs * 1000 ms = 1,800,000
    const expiryLimit = 30 * 60 * 1000; 

    if (currentTime - qrTimestamp > expiryLimit) {
        document.getElementById("result").innerText = "❌ QR Code has expired!";
        document.getElementById("result").style.color = "red";
        return;
    }

    // 3. If valid, proceed to mark attendance
    hasMarked = true;
    markAttendance(sessionName); // Pass the session name to Firestore
}

function logout() {
    localStorage.clear();
    firebase.auth().signOut().then(() => { window.location.href = "login.html"; });
}