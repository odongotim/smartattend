// ===== ScanAttend | scan.js (FULL FIXED) =====

// html5-qrcode instance
let html5QrCode = null;
let cameras = [];
let currentCameraIndex = 0;
let hasMarked = false;
let isScannerRunning = false;

// ===== GPS SETTINGS =====
const BASE_RADIUS = 100;      // meters (fallback if QR has no radius)
const MAX_ACCURACY = 200;     // meters

// ===== APPS SCRIPT URL =====
// api.js should set: window.API_URL = "https://script.google.com/macros/s/.../exec";
const API_URL = (window.API_URL || "").trim();

// ===== DEVICE ID =====
const DEVICE_ID_KEY = "scanattend_device_id";
function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = "dev_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
function deviceLockKey(session) {
  return `device_marked_${session}_${getDeviceId()}`;
}

// ===== UI =====
function updateStatus(msg, color = "#000") {
  const el = document.getElementById("result");
  if (!el) return;
  el.innerText = msg;
  el.style.color = color;
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  const reader = document.getElementById("reader");
  if (!reader) {
    console.error("Missing #reader element in HTML");
    return;
  }

  // Ensure visible area
  if (!reader.style.width) reader.style.width = "300px";
  if (!reader.style.height) reader.style.height = "320px";

  // Create scanner instance
  try {
    html5QrCode = new Html5Qrcode("reader");
  } catch (e) {
    console.error(e);
    updateStatus("QR scanner failed to initialize", "red");
    return;
  }

  // Warm GPS (optional)
  warmUpGPS();

  updateStatus("Tap 'Start Camera' to begin scanning", "#007bff");

  // Optional: allow one-tap anywhere to start (mobile user gesture requirement)
  document.body.addEventListener(
    "click",
    () => {
      if (isScannerRunning) return;
      // Only start if user has a reader area (avoid accidental start on other pages)
      startScanner();
    },
    { once: true }
  );
});

// ===== START SCANNER =====
// Call this from your Start Camera button: onclick="startScanner()"
async function startScanner() {
  try {
    cameras = await Html5Qrcode.getCameras();

    if (!cameras.length) {
      updateStatus("No camera found", "red");
      return;
    }

    const backCamIndex = cameras.findIndex(cam =>
      cam.label.toLowerCase().includes("back") ||
      cam.label.toLowerCase().includes("environment")
    );

    currentCameraIndex = backCamIndex !== -1 ? backCamIndex : 0;
    startCamera(cameras[currentCameraIndex].id);

  } catch (err) {
    console.error(err);
    updateStatus("Camera permission denied", "red");
  }
}

// ===== START CAMERA =====
async function startCamera(cameraConfigOrId) {
  // Stop any previous instance
  try { await html5QrCode.stop(); } catch (_) {}

  try {
    // Make sure the reader area is clean
    document.getElementById("reader").innerHTML = "";

    await html5QrCode.start(
      cameraConfigOrId,
      {
        fps: 12,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      onScanSuccess,
      onScanFailure
    );

    isScannerRunning = true;
    updateStatus("Scanning QR…", "green");

  } catch (err) {
    isScannerRunning = false;

    // ✅ show exact error on screen
    const name = err?.name || "CameraError";
    const msg = err?.message || String(err);
    updateStatus(`${name}: ${msg}`, "red");

    console.error("Camera start error:", err);
    throw err;
  }
}

// ===== STOP CAMERA (optional button) =====
async function stopScanner() {
  if (!html5QrCode || !isScannerRunning) return;
  try {
    await html5QrCode.stop();
  } catch (e) {
    console.warn("stopScanner warning:", e);
  }
  isScannerRunning = false;
  updateStatus("Camera stopped", "orange");
}

// ===== SWITCH CAMERA (optional button) =====
async function switchCamera() {
  if (!html5QrCode) return;

  // if we never loaded cameras list (because facingMode worked), fetch it now
  if (!cameras || cameras.length < 2) {
    try {
      cameras = await Html5Qrcode.getCameras();
    } catch (e) {}
  }

  if (!cameras || cameras.length < 2) {
    updateStatus("Only one camera available", "orange");
    return;
  }

  try {
    updateStatus("Switching camera…", "orange");
    await html5QrCode.stop();
    isScannerRunning = false;

    currentCameraIndex = (currentCameraIndex + 1) % cameras.length;
    await startCamera(cameras[currentCameraIndex].id);
  } catch (err) {
    console.error("switchCamera error:", err);
    updateStatus("Failed to switch camera", "red");
  }
}

// ===== OPTIONAL: scan failure callback =====
function onScanFailure(_) {
  // keep silent to avoid UI spam
}

// ===== GPS WARM-UP =====
function warmUpGPS() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    () => console.log("GPS warmed"),
    () => console.warn("GPS warm-up failed"),
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );
}

// ===== QR SUCCESS =====
function onScanSuccess(decodedText) {
  if (hasMarked) return;

  // display scanned content
  updateStatus("QR read. Validating…", "#007bff");

  // QR format: session|timestamp|lat|lng|expiryMins|radius(optional)
  const parts = String(decodedText || "").split("|");
  if (parts.length < 5) {
    updateStatus("Invalid QR format", "red");
    return;
  }

  const session = parts[0];
  const timestamp = Number(parts[1]);
  const qLat = parseFloat(parts[2]);
  const qLng = parseFloat(parts[3]);
  const expiryMins = Number(parts[4]);
  const qrRadius = parts[5] ? Number(parts[5]) : BASE_RADIUS;

  // Device lock (avoid duplicates)
  const lock = deviceLockKey(session);
  if (localStorage.getItem(lock) === "true") {
    updateStatus("This device already marked this session.", "orange");
    return;
  }

  // Expiry check
  if (!timestamp || !expiryMins || (Date.now() - timestamp > expiryMins * 60000)) {
    updateStatus("QR expired", "red");
    return;
  }

  hasMarked = true;
  updateStatus("Checking GPS…", "orange");

  if (!navigator.geolocation) {
    updateStatus("GPS not supported on this device", "red");
    hasMarked = false;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => validateLocation(pos, session, qLat, qLng, qrRadius),
    err => {
      console.error("GPS error:", err);
      updateStatus("GPS permission required", "red");
      hasMarked = false;
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

// ===== LOCATION VALIDATION =====
function validateLocation(pos, session, qLat, qLng, qrRadius) {
  const { latitude, longitude, accuracy } = pos.coords;

  if (accuracy > MAX_ACCURACY) {
    updateStatus("Move outdoors for better GPS accuracy", "orange");
    hasMarked = false;
    return;
  }

  const distance = getDistance(latitude, longitude, qLat, qLng);
  const allowedRadius = qrRadius + accuracy;

  if (distance > allowedRadius) {
    updateStatus(`Too far (${Math.round(distance)}m)`, "red");
    hasMarked = false;
    return;
  }

  // Optional beep
  document.getElementById("beepSound")?.play?.();

  updateStatus("Saving attendance…", "green");
  sendAttendance(session);
}

// ===== DISTANCE (Haversine) =====
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

// ===== SEND TO APPS SCRIPT (Google Sheets) =====
async function sendAttendance(session) {
  // Make sure login stored these:
  const name = (localStorage.getItem("name") || "").trim();
  const regNo = (localStorage.getItem("regNo") || "").trim();
  const email = (localStorage.getItem("email") || "").trim();
  const deviceId = getDeviceId();

  if (!name || !regNo || !email) {
    updateStatus("Missing user details. Login again.", "red");
    hasMarked = false;
    return;
  }

  if (!API_URL) {
    updateStatus("Missing API_URL. Check api.js", "red");
    hasMarked = false;
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "attendance",
        name,
        regNo,
        email,
        session,
        deviceId
      })
    });

    const data = await res.json().catch(() => ({}));

    if (data.success) {
      updateStatus("Attendance marked ✔", "green");
      localStorage.setItem(deviceLockKey(session), "true");
    } else {
      updateStatus(data.message || "Rejected", "orange");
      hasMarked = false;
    }
  } catch (err) {
    console.error("Attendance network error:", err);
    updateStatus("Network error", "red");
    hasMarked = false;
  }
}