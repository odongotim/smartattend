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

async function markAttendance(qrData) {
    const user = firebase.auth().currentUser;

    if (!user) {
        alert("Error: You must be logged in.");
        window.location.href = "login.html";
        return;
    }

    try {
        // Fetch official registration data from 'users' collection
        const userDoc = await db.collection("users").doc(user.uid).get();

        if (!userDoc.exists) {
            alert("❌ Registration data not found in 'users' collection.");
            return;
        }

        const userData = userDoc.data();
        const today = new Date().toISOString().split('T')[0]; 
        
        // Use registration number and date as a unique ID to prevent duplicates
        const docId = `${userData.regNo}_${today}`;
        const docRef = db.collection("attendance").doc(docId);

        // Save the 4 required fields
        await docRef.set({
            name: userData.name,          
            regNo: userData.regNo,        
            email: userData.email,        
            date: today,                  
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            qrInfo: qrData || "Scanned"
        }, { merge: true });

        document.getElementById("result").innerText = `Success: ${userData.name}`;
        document.getElementById("result").style.color = "green";

    } catch (err) {
        console.error("Attendance Error:", err);
        alert("Permission Denied or Network Error. Check Firebase Rules.");
        hasMarked = false; 
    }
}

function onScanSuccess(decodedText) {
    if (hasMarked) return;
    hasMarked = true;
    markAttendance(decodedText);
}

function logout() {
    localStorage.clear();
    firebase.auth().signOut().then(() => { window.location.href = "login.html"; });
}