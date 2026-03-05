// ===== ScanAttend | scan.js (MATCHES YOUR APPS SCRIPT) =====

let html5QrCode = null;
let cameras = [];
let currentCameraIndex = 0;

let hasMarked = false;
let isScannerRunning = false;
let lastDistance = null;

// ===== SETTINGS =====
const BASE_RADIUS = 100;   // meters if QR doesn't include radius
const MAX_ACCURACY = 200;  // meters (reject if GPS accuracy worse than this)

// ===== APPS SCRIPT URL (must be set in api.js) =====
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
function deviceLockKey(session, regNo) {
  // lock per session + regNo + device
  return `marked_${session}_${regNo}_${getDeviceId()}`;
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

  // ensure scanner area has size
  if (!reader.style.width) reader.style.width = "300px";
  if (!reader.style.height) reader.style.height = "320px";

  // create instance
  try {
    html5QrCode = new Html5Qrcode("reader");
  } catch (e) {
    console.error(e);
    updateStatus("Failed to initialize QR scanner", "red");
    return;
  }

  warmUpGPS();
  updateStatus("Tap Start Camera to begin", "#0b5ed7");
});

// ===== GPS warmup =====
function warmUpGPS() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    () => {},
    () => {},
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );
}

// ===== START SCANNER (call from button) =====
async function startScanner() {
  try {
    if (!API_URL) {
      updateStatus("Missing API_URL. Check api.js", "red");
      return;
    }
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    if (isScannerRunning) {
      updateStatus("Camera already running", "green");
      return;
    }

    updateStatus("Requesting camera…", "orange");

    // Best for phones: force back camera first
    try {
      await startCamera({ facingMode: "environment" });
      return;
    } catch (_) {
      // fallback below
    }

    // Fallback: list cameras
    cameras = await Html5Qrcode.getCameras();
    if (!cameras || cameras.length === 0) {
      updateStatus("No camera found", "red");
      return;
    }

    // prefer "back" camera by label if available
    const backIndex = cameras.findIndex(c => {
      const label = (c.label || "").toLowerCase();
      return label.includes("back") || label.includes("rear") || label.includes("environment");
    });

    currentCameraIndex = backIndex !== -1 ? backIndex : 0;
    await startCamera(cameras[currentCameraIndex].id);
  } catch (err) {
    console.error("startScanner error:", err);
    const msg = err?.name ? `${err.name}: ${err.message || ""}` : String(err);
    updateStatus("Camera error: " + msg, "red");
  }
}

// ===== START CAMERA =====
async function startCamera(cameraIdOrConfig) {
  // stop if already running
  try {
    if (isScannerRunning) await html5QrCode.stop();
  } catch (_) {}

  // clear reader (helps black screen in some phones)
  const reader = document.getElementById("reader");
  if (reader) reader.innerHTML = "";

  try {
    await html5QrCode.start(
      cameraIdOrConfig,
      {
        fps: 12,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      onScanSuccess,
      () => {} // ignore failures
    );

    isScannerRunning = true;
    updateStatus("Scanning…", "green");
  } catch (err) {
    isScannerRunning = false;
    const msg = err?.name ? `${err.name}: ${err.message || ""}` : String(err);
    updateStatus("Failed to start camera: " + msg, "red");
    throw err;
  }
}

// ===== SWITCH CAMERA =====
async function switchCamera() {
  try {
    if (!cameras || cameras.length < 2) {
      cameras = await Html5Qrcode.getCameras();
    }
    if (!cameras || cameras.length < 2) {
      updateStatus("Only one camera available", "orange");
      return;
    }
    updateStatus("Switching camera…", "orange");

    if (isScannerRunning) {
      await html5QrCode.stop();
      isScannerRunning = false;
    }

    currentCameraIndex = (currentCameraIndex + 1) % cameras.length;
    await startCamera(cameras[currentCameraIndex].id);
  } catch (err) {
    console.error("switchCamera error:", err);
    updateStatus("Failed to switch camera", "red");
  }
}

// ===== QR SUCCESS =====
// Expected QR format: session|timestamp|lat|lng|expiryMins|radius(optional)
function onScanSuccess(decodedText) {
  if (hasMarked) return;

  const parts = String(decodedText || "").split("|");
  if (parts.length < 5) {
    updateStatus("Invalid QR format", "red");
    return;
  }

  const session = String(parts[0] || "").trim();
  const timestamp = Number(parts[1]);
  const qLat = parseFloat(parts[2]);
  const qLng = parseFloat(parts[3]);
  const expiryMins = Number(parts[4]);
  const qrRadius = parts[5] ? Number(parts[5]) : BASE_RADIUS;

  if (!session || !timestamp || Number.isNaN(qLat) || Number.isNaN(qLng) || !expiryMins) {
    updateStatus("QR data invalid", "red");
    return;
  }

  // Expiry check
  if (Date.now() - timestamp > expiryMins * 60000) {
    updateStatus("QR expired", "red");
    return;
  }

  // User details (must match your auth storage)
  const name = (localStorage.getItem("name") || "").trim();
  const regNo = (localStorage.getItem("regNo") || "").trim();
  const email = (localStorage.getItem("email") || "").trim().toLowerCase();

  if (!name || !regNo || !email) {
    updateStatus("Missing user details. Login again.", "red");
    return;
  }

  // Local device duplicate lock (fast)
  const lock = deviceLockKey(session, regNo);
  if (localStorage.getItem(lock) === "true") {
    updateStatus("Already marked on this device.", "orange");
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
    pos => validateLocation(pos, { session, qLat, qLng, qrRadius, name, regNo, email, lock }),
    err => {
      console.error("GPS error:", err);
      updateStatus("GPS permission required", "red");
      hasMarked = false;
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

// ===== LOCATION VALIDATION + DISTANCE MESSAGE =====
function validateLocation(pos, payload) {
  const { latitude, longitude, accuracy } = pos.coords;

  if (accuracy > MAX_ACCURACY) {
    updateStatus(`GPS weak (±${Math.round(accuracy)}m). Move outdoors.`, "orange");
    hasMarked = false;
    return;
  }

  const distance = getDistance(latitude, longitude, payload.qLat, payload.qLng);
  lastDistance = distance;

  const allowedRadius = payload.qrRadius + accuracy;

  if (distance > allowedRadius) {
    const moveCloser = Math.max(0, Math.round(distance - allowedRadius));
    updateStatus(
      `Too far: ${Math.round(distance)}m away. Move closer by ~${moveCloser}m.`,
      "red"
    );
    hasMarked = false;
    return;
  }

  const margin = Math.max(0, Math.round(allowedRadius - distance));
  updateStatus(
    `Inside area ✅ Distance: ${Math.round(distance)}m (margin ~${margin}m). Saving…`,
    "green"
  );

  document.getElementById("beepSound")?.play?.();

  // Send to Apps Script (exact keys it expects)
  sendAttendance(payload);
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

// ===== SEND TO APPS SCRIPT (MATCHING YOUR doPost attendance) =====
async function sendAttendance(p) {
  try {
    const deviceId = getDeviceId();

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "attendance",
        session: p.session,
        name: p.name,
        regNo: p.regNo,
        email: p.email,
        deviceId: deviceId
      })
    });

    const data = await res.json().catch(() => ({}));

    if (data.success) {
      updateStatus("Attendance marked ✔", "green");
      localStorage.setItem(p.lock, "true"); // local lock
    } else {
      updateStatus(data.message || "Rejected", "orange");
    }
  } catch (err) {
    console.error("Attendance network error:", err);
    updateStatus("Network error", "red");
  } finally {
    hasMarked = false;
  }
}

// expose for HTML buttons
window.startScanner = startScanner;
window.switchCamera = switchCamera;