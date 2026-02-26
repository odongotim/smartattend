// Get data from localStorage
const userName = localStorage.getItem("name");
const regNo = localStorage.getItem("regNo");

// Display user info
if (userName && regNo) {
    document.getElementById("user").innerText = `Logged in as: ${userName} (${regNo})`;
}

function logout() {
    localStorage.clear();
    firebase.auth().signOut().then(() => {
        window.location.href = "login.html";
    });
}

let hasMarked = false; // prevents duplicate marking per scan

function markAttendance(qrData) {
    const user = firebase.auth().currentUser;

    if (!user) {
        alert("❌ You are not logged in. Please login again.");
        window.location.href = "login.html";
        return;
    }

    // Save to Firestore
    db.collection("attendance").add({
        uid: user.uid,
        name: userName,
        regNo: regNo,
        scanData: qrData || "No data",
        time: firebase.firestore.FieldValue.serverTimestamp() // Better than local time
    })
    .then(() => {
        document.getElementById("result").innerText = "✅ Attendance marked";
        // Optional: Reset hasMarked after 5 seconds if you want to allow another scan
        setTimeout(() => { hasMarked = false; }, 5000);
    })
    .catch(err => {
        console.error("Attendance error:", err);
        alert("❌ Attendance not saved. Check console.");
        hasMarked = false;
    });
}

function onScanSuccess(decodedText) {
    console.log("QR scanned:", decodedText);
    if (hasMarked) return;
    hasMarked = true;
    
    // Pass the scanned text to the marking function
    markAttendance(decodedText);
}

// ---------------- Camera Switch Logic ----------------
const html5QrCode = new Html5Qrcode("reader");
let cameras = [];
let currentCameraIndex = 0;
let isSwitching = false;

function startCamera(index) {
    if (!cameras || cameras.length === 0) return;

    const cameraId = cameras[index].id;

    html5QrCode.start(
        cameraId,
        { fps: 10, qrbox: 250 },
        onScanSuccess,
        errorMessage => { /* Silently catch scan noise */ }
    ).catch(err => console.error("Unable to start camera:", err));
}

// Get all cameras and start default
Html5Qrcode.getCameras()
    .then(camList => {
        if (camList && camList.length) {
            cameras = camList;
            // Default: try to select back camera first
            const backCamIndex = camList.findIndex(c => 
                c.label.toLowerCase().includes("back") || 
                c.label.toLowerCase().includes("rear")
            );
            currentCameraIndex = backCamIndex >= 0 ? backCamIndex : 0;
            startCamera(currentCameraIndex);
        } else {
            alert("No camera found on this device.");
        }
    })
    .catch(err => console.error("Error getting cameras:", err));

function switchCamera() {
    if (cameras.length < 2 || isSwitching) return;

    isSwitching = true;
    currentCameraIndex = (currentCameraIndex + 1) % cameras.length;

    html5QrCode.stop()
        .then(() => startCamera(currentCameraIndex))
        .catch(err => console.error("Switch error:", err))
        .finally(() => { isSwitching = false; });
}