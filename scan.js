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
    const name = localStorage.getItem("studentName");
    const email = localStorage.getItem("studentEmail");
    const regNo = localStorage.getItem("studentRegNo");

    if (!name || !email || !regNo) {
        updateStatus("User details missing", "#ff4d4d");
        return;
    }

    // FRONTEND duplicate check (per session)
    const key = `marked_${session}`;
    if (localStorage.getItem(key)) {
        updateStatus("Attendance already marked!", "#ffcc00");
        return;
    }

    fetch("https://script.google.com/macros/s/AKfycbx6ruL3dqMOHz4omCBwZT6GSna-4Gjoa-vNrpsP5ilkLzeD8TAbwNpNRNYU8IE8p1oquA/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name,
            regNo,
            email,
            session,
            time: new Date().toLocaleString()
        })
    })
    .then(res => res.text())
    .then(msg => {
        if (msg === "DUPLICATE") {
            updateStatus("Already marked for this session", "#ffcc00");
        } else {
            updateStatus("Attendance Marked!", "#00ff88");
            localStorage.setItem(key, "true"); // lock for this session
            hasMarked = true;
        }
    })
    .catch(() => {
        updateStatus("Failed to save attendance", "#ff4d4d");
    });
}