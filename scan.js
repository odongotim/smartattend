/*************************************************
 * ScanAttend – scan.js (FULL FIXED VERSION)
 *************************************************/

let html5QrCode;
let cameras = [];
let currentCameraIndex = 0;
let hasMarked = false;

// ===== GPS SETTINGS (REALISTIC & SAFE) =====
const BASE_RADIUS = 100;     // meters (campus-safe)
const MAX_ACCURACY = 150;    // meters (reject weak GPS)

// ===== API =====
const API_URL = "https://script.google.com/macros/s/AKfycbwLVqhFMRQT0LHup3ilj_PLa_pFC_a9E5RtkZcXlVDFz2-uRnrxw1KN9XuBZmWuaa0d_g/exec";

// ===== INIT =====
window.onload = () => {
  html5QrCode = new Html5Qrcode("reader");
  warmUpGPS();
  startScanner();
};

// ===== GPS WARM-UP (VERY IMPORTANT) =====
function warmUpGPS() {
  navigator.geolocation.getCurrentPosition(
    () => console.log("GPS warmed"),
    () => console.warn("GPS warm-up failed"),
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// ===== START CAMERA =====
async function startScanner() {
  try {
    const devices = await Html5Qrcode.getCameras();

    if (!devices || devices.length === 0) {
      updateStatus("No camera found", "red");
      return;
    }

    cameras = devices;

    // Prefer back camera
    const backIndex = cameras.findIndex(d =>
      d.label.toLowerCase().includes("back") ||
      d.label.toLowerCase().includes("environment")
    );

    currentCameraIndex = backIndex !== -1 ? backIndex : 0;
    launchCamera(currentCameraIndex);

  } catch (err) {
    console.error(err);
    updateStatus("Camera access denied", "red");
  }
}

// ===== LAUNCH CAMERA =====
function launchCamera(index) {
  html5QrCode.start(
    cameras[index].id,
    {
      fps: 15,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    },
    onScanSuccess,
    err => console.warn(err)
  ).then(() => {
    updateStatus("Scanning QR…", "#007bff");
  });
}

// ===== SWITCH CAMERA (OPTIONAL BUTTON) =====
async function switchCamera() {
  if (cameras.length < 2) return;
  await html5QrCode.stop();
  currentCameraIndex = (currentCameraIndex + 1) % cameras.length;
  launchCamera(currentCameraIndex);
}

// ===== QR SUCCESS =====
function onScanSuccess(decodedText) {
  if (hasMarked) return;

  const parts = decodedText.split("|");
  if (parts.length < 5) return;

  const [session, timestamp, qLat, qLng, expiry] = parts;

  // ---- TIME EXPIRY CHECK ----
  if (Date.now() - Number(timestamp) > Number(expiry) * 60000) {
    updateStatus("QR code expired", "red");
    return;
  }

  updateStatus("Checking GPS location…", "#ff9800");

  navigator.geolocation.getCurrentPosition(
    pos => validateLocation(pos, session, qLat, qLng),
    () => updateStatus("GPS permission required", "red"),
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
}

// ===== LOCATION VALIDATION =====
function validateLocation(pos, session, qLat, qLng) {
  const userLat = pos.coords.latitude;
  const userLng = pos.coords.longitude;
  const accuracy = pos.coords.accuracy;

  // Reject weak GPS
  if (accuracy > MAX_ACCURACY) {
    updateStatus("Move outdoors for better GPS accuracy", "orange");
    return;
  }

  const distance = getDistance(
    userLat,
    userLng,
    parseFloat(qLat),
    parseFloat(qLng)
  );

  const allowedRadius = BASE_RADIUS + accuracy;

  if (distance > allowedRadius) {
    updateStatus(
      `Too far (${Math.round(distance)}m). Accuracy ±${Math.round(accuracy)}m`,
      "red"
    );
    return;
  }

  document.getElementById("beepSound")?.play();
  hasMarked = true;
  markAttendance(session);
}

// ===== DISTANCE FORMULA =====
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ===== UI STATUS =====
function updateStatus(msg, color) {
  const el = document.getElementById("result");
  if (!el) return;
  el.innerText = msg;
  el.style.color = color;
}

// ===== MARK ATTENDANCE =====
function markAttendance(session) {
  const name = localStorage.getItem("userName");
  const regNo = localStorage.getItem("userRegNo");
  const email = localStorage.getItem("userEmail");

  if (!name || !regNo || !email) {
    updateStatus("Session expired. Please login again.", "red");
    return;
  }

  // Prevent duplicate per session (client-side)
  const sessionKey = `attendance_${session}`;
  if (localStorage.getItem(sessionKey)) {
    updateStatus("Attendance already marked!", "orange");
    return;
  }

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "attendance",
      name,
      regNo,
      email,
      session
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        updateStatus("Attendance marked successfully!", "green");
        localStorage.setItem(sessionKey, "true");
      } else {
        updateStatus(data.message || "Attendance rejected", "orange");
        hasMarked = false;
      }
    })
    .catch(err => {
      console.error(err);
      updateStatus("Network error. Try again.", "red");
      hasMarked = false;
    });
}