// Add this helper function at the top of scan.js
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}

// --- Global Variables ---
let currentCameraIndex = 0;
let isSwitching = false;

function startCamera(index) {
    if (!cameras || cameras.length === 0) return;

    // Ensure we are using the correct ID from the list
    const cameraId = cameras[index].id;

    html5QrCode.start(
        cameraId,
        { 
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0 
        },
        onScanSuccess,
        errorMessage => { /* Noise */ }
    ).catch(err => {
        console.error("Camera start error:", err);
        isSwitching = false;
    });
}

async function switchCamera() {
    // 1. Prevent multiple rapid clicks
    if (cameras.length < 2 || isSwitching) {
        console.log("Switching in progress or only one camera available.");
        return;
    }
    
    isSwitching = true;
    const resultElement = document.getElementById("result");
    resultElement.innerText = "Switching camera...";

    try {
        // 2. STOPS the current stream properly
        const state = html5QrCode.getState();
        if (state !== Html5QrcodeScannerState.NOT_STARTED) {
            await html5QrCode.stop();
        }

        // 3. Increment index and restart
        currentCameraIndex = (currentCameraIndex + 1) % cameras.length;
        await startCamera(currentCameraIndex);
        
        resultElement.innerText = "Camera ready.";
        console.log("Switched to camera:", cameras[currentCameraIndex].label);
    } catch (err) {
        console.error("Error during camera switch:", err);
        resultElement.innerText = "Switch Failed. Try refreshing.";
    } finally {
        // 4. Release the lock
        setTimeout(() => { isSwitching = false; }, 500);
    }
}

function onScanSuccess(decodedText) {
    if (hasMarked) return;

    const parts = decodedText.split('|');
    if (parts.length < 5) {
        updateStatus("Invalid QR Format", "red");
        return;
    }

    const [sessionName, timestamp, qLat, qLng, expiryMins] = parts;
    const currentTime = Date.now();
    const expiryLimit = parseInt(expiryMins) * 60 * 1000;

    // 1. Time Check
    if (currentTime - parseInt(timestamp) > expiryLimit) {
        updateStatus("QR Code Expired", "red");
        return;
    }

    // 2. Location Check
    updateStatus("Verifying Location...", "orange");
    navigator.geolocation.getCurrentPosition(pos => {
        const distance = getDistance(pos.coords.latitude, pos.coords.longitude, parseFloat(qLat), parseFloat(qLng));
        
        if (distance > 50) { // Limit: 50 meters
            updateStatus(`Too Far: ${Math.round(distance)}m away`, "red");
        } else {
            hasMarked = true;
            markAttendance(sessionName);
        }
    }, err => {
        updateStatus("Enable GPS to mark attendance", "red");
    });
}

function updateStatus(msg, color) {
    const res = document.getElementById("result");
    res.innerText = msg;
    res.style.color = color;
}