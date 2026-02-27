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
        fps: 20, // Increased for smoother detection
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        // Force the camera to look for high-quality detail
        videoConstraints: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    };

    html5QrCode.start(cameras[index].id, config, onScanSuccess)
        .then(() => {
            isScanning = true;
            updateStatus("System Active: Point at QR", "#A3E635");
        })
        .catch(err => {
            console.error("Start Failed:", err);
            updateStatus("Focus Error: Refresh Page", "red");
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
    console.log("Raw Scanned Data:", decodedText); // <--- Add this!

    if (hasMarked) return;

    const parts = decodedText.split('|');
    
    // If your QR was generated with a different character (like a comma),
    // this check will fail and the function will stop here.
    if (parts.length < 5) {
        console.warn("Format Mismatch. Expected 5 parts, got:", parts.length);
        return; 
    }
    
    // ... rest of your logic
}

function updateStatus(msg, color) {
    const res = document.getElementById("result");
    res.innerText = msg;
    res.style.color = color;
}