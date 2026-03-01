let html5QrCode;
let cameras = [];
let currentCameraIndex = 0;
let hasMarked = false;

// ===== GPS SETTINGS =====
const BASE_RADIUS = 1000;   // meters
const MAX_ACCURACY = 1500; // meters

// ===== INIT =====
window.onload = async () => {
  html5QrCode = new Html5Qrcode("reader");
  warmUpGPS();
  await startScanner();
};

// ===== GPS WARM-UP =====
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
  }).catch(() => {
    updateStatus("Failed to start camera", "red");
  });
}

// ===== QR SUCCESS =====
function onScanSuccess(decodedText) {
  if (hasMarked) return;

  const parts = decodedText.split("|");
  if (parts.length < 5) return;

  const [session, timestamp, qLat, qLng, expiry] = parts;

  // QR expiry check
  if (Date.now() - Number(timestamp) > Number(expiry) * 60000) {
    updateStatus("QR code expired", "red");
    return;
  }

  updateStatus("Checking GPS location…", "orange");

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
      `Too far (${Math.round(distance)}m). Accuracy ±${Math.round(accuracy)}m`,
      "red"
    );
    return;
  }

  document.getElementById("beepSound")?.play();
  hasMarked = true;
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