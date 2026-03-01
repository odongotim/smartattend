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
        // Explicitly ask for permission first by listing devices
        const devices = await Html5Qrcode.getCameras();
        
        if (devices && devices.length > 0) {
            cameras = devices;
            // Look for 'back' or 'environment' in the label
            const backIdx = devices.findIndex(d => 
                d.label.toLowerCase().includes('back') || 
                d.label.toLowerCase().includes('environment')
            );
            currentCameraIndex = (backIdx !== -1) ? backIdx : 0;
            launchCamera(currentCameraIndex);
        } else {
            updateStatus("No cameras found on this device.", "#ff4d4d");
        }
    } catch (err) {
        console.error("Camera Error:", err);
        updateStatus("Camera access denied. Please check site permissions.", "#ff4d4d");
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

// 2. GPS Check
updateStatus("Checking GPS location...", "#ffcc00");

navigator.geolocation.getCurrentPosition(
  pos => {
    const userLat = pos.coords.latitude;
    const userLng = pos.coords.longitude;
    const accuracy = pos.coords.accuracy; // meters

    // Reject fake / weak GPS
    if (accuracy > 50) {
      updateStatus("GPS accuracy too low. Move outdoors.", "#ff4d4d");
      return;
    }

    const dist = getDistance(
      userLat,
      userLng,
      parseFloat(qLat),
      parseFloat(qLng)
    );

    if (dist > 50) {
      updateStatus(`Too far (${Math.round(dist)}m)`, "#ff4d4d");
    } else {
      document.getElementById("beepSound").play();
      hasMarked = true;
      markAttendance(session);
    }
  },
  err => {
    updateStatus("GPS permission required", "#ff4d4d");
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  }
);

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

function markAttendance(session) {
    // Match the keys you saved in login.js
    const name = localStorage.getItem("userName");
    const email = localStorage.getItem("userEmail");
    const regNo = localStorage.getItem("userRegNo");

    if (!name || !regNo) {
        updateStatus("User session expired. Please re-login.", "#ff4d4d");
        return;
    }

    const key = `marked_${session}`;
    if (localStorage.getItem(key)) {
        updateStatus("Attendance already marked!", "#ffcc00");
        return;
    }

    // Use the same API_URL from your api.js
    fetch("https://script.google.com/macros/s/AKfycbwLVqhFMRQT0LHup3ilj_PLa_pFC_a9E5RtkZcXlVDFz2-uRnrxw1KN9XuBZmWuaa0d_g/exec", {
        method: "POST",
        body: JSON.stringify({
            action: "attendance", // Critical for your Apps Script switch
            name: name,
            regNo: regNo,
            email: email,
            session: session
        })
    })
    .then(res => res.json()) // Change to .json() since your Apps Script returns JSON
    .then(data => {
        if (data.success) {
            updateStatus("Attendance Marked!", "#00ff88");
            localStorage.setItem(key, "true");
            hasMarked = true;
        } else {
            updateStatus(data.message || "Marking failed", "#ffcc00");
        }
    })
    .catch(err => {
        console.error(err);
        updateStatus("Network error: Failed to save", "#ff4d4d");
    });
}