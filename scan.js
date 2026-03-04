let html5QrCode;
let cameras = [];
let currentCameraIndex = 0;
let hasMarked = false;
let currentSession = null;

// ===== GPS SETTINGS =====
const BASE_RADIUS = 100;
const MAX_ACCURACY = 200;
const GPS_RETRY_LIMIT = 2;

// ===== API =====
const API_URL = "https://script.google.com/macros/s/AKfycbz_K4KR--0dgrY_BBSvjOuL5oIjcNMtiWgeZWwLzYMaYqdaGOfWpFB5dOUpeun3uSGIbQ/exec";

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

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  // IMPORTANT: ensure reader has height
  const reader = document.getElementById("reader");
  if (reader && !reader.style.height) reader.style.height = "320px";

  html5QrCode = new Html5Qrcode("reader");

  // Warm GPS early
  warmUpGPS();

  updateStatus("Tap 'Start Camera' to begin scanning", "#007bff");
});

// ===== START SCANNER (user gesture friendly) =====
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

function startCamera(cameraId) {
  html5QrCode.start(
    cameraId,
    {
      fps: 20,
      qrbox: 250,
      aspectRatio: 1
    },
    onScanSuccess
  ).then(() => {
    updateStatus("Scanning QR…", "green");
  }).catch(err => {
    console.error(err);
    updateStatus("Failed to start camera", "red");
  });
}

// ===== SWITCH CAMERA =====
async function switchCamera() {
  if (!cameras || cameras.length < 2) {
    updateStatus("Only one camera available.", "orange");
    return;
  }

  try {
    await html5QrCode.stop();
    currentCameraIndex = (currentCameraIndex + 1) % cameras.length;
    await startCamera(cameras[currentCameraIndex].id);
  } catch (err) {
    console.error("Switch camera error:", err);
    updateStatus("Failed to switch camera.", "red");
  }
}

// ===== GPS WARM-UP =====
function warmUpGPS() {
  navigator.geolocation.getCurrentPosition(
    () => console.log("GPS warmed"),
    () => console.warn("GPS warm-up failed"),
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );
}

// ===== QR SUCCESS =====
function onScanSuccess(decodedText) {
  if (hasMarked) return;

  const parts = decodedText.split("|");
  if (parts.length < 5) return;

  const session = parts[0];
  const timestamp = Number(parts[1]);
  const qLat = parseFloat(parts[2]);
  const qLng = parseFloat(parts[3]);
  const expiry = Number(parts[4]);
  const qrRadius = parts[5] ? Number(parts[5]) : BASE_RADIUS;

  // Device duplicate lock
  const lock = deviceLockKey(session);
  if (localStorage.getItem(lock) === "true") {
    updateStatus("This device already marked this session.", "orange");
    return;
  }

  // Expiry
  if (Date.now() - timestamp > expiry * 60000) {
    updateStatus("QR expired", "red");
    return;
  }

  updateStatus("Checking GPS…", "orange");
  hasMarked = true;

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

  document.getElementById("beepSound")?.play();
  updateStatus("Saving attendance…", "green");
  markAttendance(session);
}

// ===== DISTANCE =====
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

// ===== UI =====
function updateStatus(msg, color) {
  const el = document.getElementById("result");
  if (!el) return;
  el.innerText = msg;
  el.style.color = color;
}

// ===== SEND TO APPS SCRIPT =====
async function markAttendance(session) {
  const name = (localStorage.getItem("name") || "").trim();
  const regNo = (localStorage.getItem("regNo") || "").trim();
  const email = (localStorage.getItem("email") || "").trim();
  const deviceId = getDeviceId();

  if (!name || !regNo || !email) {
    updateStatus("Missing user details. Login again.", "red");
    hasMarked = false;
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "attendance", name, regNo, email, session, deviceId })
    });
    const data = await res.json();

    if (data.success) {
      updateStatus("Attendance marked ✔", "green");
      localStorage.setItem(deviceLockKey(session), "true");
    } else {
      updateStatus(data.message || "Rejected", "orange");
      hasMarked = false;
    }
  } catch (err) {
    console.error(err);
    updateStatus("Network error", "red");
    hasMarked = false;
  }
}