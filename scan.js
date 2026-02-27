// Global Scope
let html5QrCode;
let cameras = [];
let currentCameraIndex = 0;
let isScanning = false;

// 1. Wait for DOM and Library
window.onload = () => {
    html5QrCode = new Html5Qrcode("reader");
    requestCameraAccess();
};

async function requestCameraAccess() {
    try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
            cameras = devices;
            // Auto-select back camera (usually contains 'back' or 'rear' in label)
            const backCamIndex = devices.findIndex(d => 
                d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')
            );
            currentCameraIndex = backCamIndex !== -1 ? backCamIndex : 0;
            startCamera(currentCameraIndex);
        } else {
            updateStatus("No hardware cameras detected", "red");
        }
    } catch (err) {
        console.error("Access Error:", err);
        updateStatus("Permission Denied: Please enable camera in settings", "red");
    }
}

function startCamera(index) {
    const config = { 
        fps: 15, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0 
    };

    html5QrCode.start(cameras[index].id, config, onScanSuccess)
        .then(() => {
            isScanning = true;
            updateStatus("System Ready", "#A3E635");
        })
        .catch(err => {
            console.error("Start Failed:", err);
            updateStatus("Camera Busy: Close other apps", "red");
        });
}

async function switchCamera() {
    if (cameras.length < 2 || !isScanning) return;
    
    try {
        await html5QrCode.stop();
        isScanning = false;
        currentCameraIndex = (currentCameraIndex + 1) % cameras.length;
        startCamera(currentCameraIndex);
    } catch (err) {
        console.error("Switch Error:", err);
    }
}

// Logic for Location and Time Verification
function onScanSuccess(decodedText) {
    if (hasMarked) return;

    const parts = decodedText.split('|');
    if (parts.length < 5) return updateStatus("Invalid Format", "red");

    const [session, timestamp, qLat, qLng, expiry] = parts;
    
    // Time Validation
    if (Date.now() - parseInt(timestamp) > (parseInt(expiry) * 60000)) {
        return updateStatus("QR Expired", "red");
    }

    // Location Validation
    updateStatus("Verifying Location...", "orange");
    navigator.geolocation.getCurrentPosition(pos => {
        const distance = getDistance(
            pos.coords.latitude, pos.coords.longitude, 
            parseFloat(qLat), parseFloat(qLng)
        );

        if (distance > 50) {
            updateStatus(`Out of Range: ${Math.round(distance)}m`, "red");
        } else {
            hasMarked = true;
            document.getElementById("beepSound").play();
            markAttendance(session);
        }
    }, () => updateStatus("GPS Required", "red"), { enableHighAccuracy: true });
}

function updateStatus(msg, color) {
    const res = document.getElementById("result");
    res.innerText = msg;
    res.style.color = color;
}