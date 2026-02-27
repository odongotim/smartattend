let html5QrCode;
let cameras = [];
let currentCameraIndex = 0;
let hasMarked = false;

window.onload = () => {
    html5QrCode = new Html5Qrcode("reader");
    startScannerEngine();
};

async function startScannerEngine() {
    try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
            cameras = devices;
            // Select back camera if found
            const backIdx = devices.findIndex(d => d.label.toLowerCase().includes('back'));
            currentCameraIndex = (backIdx !== -1) ? backIdx : 0;
            launchCamera(currentCameraIndex);
        }
    } catch (err) {
        document.getElementById("result").innerText = "Camera access denied.";
    }
}

function launchCamera(index) {
    const config = {
        fps: 20,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        videoConstraints: { facingMode: "environment" } 
    };

    html5QrCode.start(cameras[index].id, config, onScanSuccess)
        .then(() => document.getElementById("result").innerText = "Scanning...")
        .catch(err => console.error(err));
}

async function switchCamera() {
    if (cameras.length < 2) return;
    await html5QrCode.stop();
    currentCameraIndex = (currentCameraIndex + 1) % cameras.length;
    launchCamera(currentCameraIndex);
}

function onScanSuccess(decodedText) {
    if (hasMarked) return;

    const parts = decodedText.split('|');
    if (parts.length < 5) return; // Ignore non-system QR codes

    const [session, timestamp, qLat, qLng, expiry] = parts;
    
    // 1. Time Check
    if (Date.now() - parseInt(timestamp) > (parseInt(expiry) * 60000)) {
        updateStatus("QR Expired!", "#ff4d4d");
        return;
    }

    // 2. GPS Check
    updateStatus("Verifying Location...", "#ffcc00");
    navigator.geolocation.getCurrentPosition(pos => {
        const dist = getDistance(pos.coords.latitude, pos.coords.longitude, parseFloat(qLat), parseFloat(qLng));
        
        if (dist > 5000000) { // 50-meter radius
            updateStatus(`Too Far (${Math.round(dist)}m)`, "#ff4d4d");
        } else {
            document.getElementById("beepSound").play();
            hasMarked = true;
            markAttendance(session);
        }
    }, () => updateStatus("GPS Access Required", "#ff4d4d"));
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function updateStatus(msg, color) {
    const res = document.getElementById("result");
    res.innerText = msg;
    res.style.color = color;
}

// Function to save to Firebase
function markAttendance(session) {
    const user = firebase.auth().currentUser;
    if (!user) return alert("Not logged in");

    db.collection("attendance").add({
        email: user.email,
        session: session,
        time: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        updateStatus("Attendance Marked!", "#00ff88");
        setTimeout(() => window.alert = Successl, 1500);
    });
}