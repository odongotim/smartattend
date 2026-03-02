let html5QrCode;
let cameras = [];
let currentCameraIndex = 0;
let hasMarked = false;
let currentSession = null;

// ===== GPS SETTINGS =====
const BASE_RADIUS = 100;     // meters
const MAX_ACCURACY = 200;   // meters
const GPS_RETRY_LIMIT = 2;

// ===== INIT =====
window.onload = async () => {
  html5QrCode = new Html5Qrcode("reader");
  warmUpGPS();
  await startScanner();
};

// ===== GPS WARM-UP =====
function warmUpGPS() {
  navigator.geolocation.getCurrentPosition(
    pos => {
      console.log("GPS warmed:", pos.coords.accuracy);
    },
    err => {
      console.warn("GPS warm-up failed:", err.message);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// ===== START SCANNER =====
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

// ===== QR SUCCESS =====
function onScanSuccess(decodedText) {
  if (hasMarked) return;

  const parts = decodedText.split("|");
  if (parts.length < 5) {
    updateStatus("Invalid QR code", "red");
    return;
  }

  const [session, timestamp, qLat, qLng, expiry] = parts;

  // Prevent duplicate marking per session
  if (currentSession === session) {
    updateStatus("Attendance already recorded", "orange");
    return;
  }

  // QR expiry check
  if (Date.now() - Number(timestamp) > Number(expiry) * 60000) {
    updateStatus("QR code expired", "red");
    return;
  }

  updateStatus("Checking GPS location…", "orange");

  getGPSWithRetry(0, session, qLat, qLng);
}

// ===== GPS WITH RETRY =====
function getGPSWithRetry(attempt, session, qLat, qLng) {
  navigator.geolocation.getCurrentPosition(
    pos => {
      logGPS(pos);
      validateLocation(pos, session, qLat, qLng);
    },
    err => {
      if (attempt < GPS_RETRY_LIMIT) {
        updateStatus("Retrying GPS…", "orange");
        setTimeout(() => {
          getGPSWithRetry(attempt + 1, session, qLat, qLng);
        }, 2000);
      } else {
        console.error("GPS Error:", err);
        updateStatus("GPS permission required or unavailable", "red");
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
}

// ===== GPS DEBUG LOG =====
function logGPS(pos) {
  console.log("📍 GPS DEBUG");
  console.log("Latitude:", pos.coords.latitude);
  console.log("Longitude:", pos.coords.longitude);
  console.log("Accuracy (m):", pos.coords.accuracy);
  console.log("Timestamp:", new Date(pos.timestamp).toLocaleString());

  updateStatus(
    `GPS ±${Math.round(pos.coords.accuracy)}m`,
    pos.coords.accuracy > MAX_ACCURACY ? "orange" : "green"
  );
}

// ===== LOCATION VALIDATION =====
function validateLocation(pos, session, qLat, qLng) {
  const { latitude, longitude, accuracy } = pos.coords;

  if (accuracy > MAX_ACCURACY) {
    updateStatus("Move outdoors for better GPS accuracy", "orange");
    return;
  }

  const distance = getDistance(
    latitude,
    longitude,
    parseFloat(qLat),
    parseFloat(qLng)
  );

  const allowedRadius = BASE_RADIUS + accuracy;

  if (distance > allowedRadius) {
    updateStatus(
      `Too far (${Math.round(distance)}m). Allowed ~${Math.round(allowedRadius)}m`,
      "red"
    );
    return;
  }

  // SUCCESS
  document.getElementById("beepSound")?.play();
  hasMarked = true;
  currentSession = session;

  updateStatus("Attendance marked ✔", "green");
  markAttendance(session);
}

// ===== DISTANCE CALCULATION =====
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
function updateStatus(message, color) {
  const el = document.getElementById("result");
  if (!el) return;
  el.innerText = message;
  el.style.color = color;
}