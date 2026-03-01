let html5QrCode;
let cameras = [];
let currentCameraIndex = 0;
let hasMarked = false;

window.onload = async () => {
  html5QrCode = new Html5Qrcode("reader");
  await startScannerEngine();
};

async function startScannerEngine() {
  try {
    const devices = await Html5Qrcode.getCameras();

    if (!devices || devices.length === 0) {
      updateStatus("No camera found", "red");
      return;
    }

    cameras = devices;

    // Prefer back camera
    const backCam = devices.findIndex(d =>
      d.label.toLowerCase().includes("back") ||
      d.label.toLowerCase().includes("environment")
    );

    currentCameraIndex = backCam !== -1 ? backCam : 0;

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
    updateStatus("Scanning...", "green");
  }).catch(err => {
    console.error(err);
    updateStatus("Failed to start camera", "red");
  });
}

function onScanSuccess(decodedText) {
  if (hasMarked) return;

  const parts = decodedText.split("|");
  if (parts.length < 5) return;

  const [session, timestamp, qLat, qLng, expiry] = parts;

  // Expiry check
  if (Date.now() - Number(timestamp) > Number(expiry) * 60000) {
    updateStatus("QR expired", "red");
    return;
  }

  updateStatus("Checking GPS...", "orange");

  navigator.geolocation.getCurrentPosition(
  pos => {
    const userLat = pos.coords.latitude;
    const userLng = pos.coords.longitude;
    const accuracy = pos.coords.accuracy; // meters

    // Reject very weak GPS
    if (accuracy > 150) {
      updateStatus("Move outdoors for better GPS accuracy", "orange");
      hasMarked = false;
      return;
    }

    const distance = getDistance(userLat, userLng, qLat, qLng);

    // Dynamic radius: base radius + accuracy buffer
    const allowedRadius = 50 + accuracy;

    if (distance > allowedRadius) {
      updateStatus(
        `Too far (${Math.round(distance)}m). Accuracy: ${Math.round(accuracy)}m`,
        "red"
      );
      hasMarked = false;
      return;
    }

    hasMarked = true;
    markAttendance(session);
  },
  err => updateStatus("GPS permission required", "red"),
  {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0
  }
);
}

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

function updateStatus(text, color) {
  const el = document.getElementById("result");
  el.innerText = text;
  el.style.color = color;
}