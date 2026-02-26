// Firebase already initialized
const userName = localStorage.getItem("name");
const regNo = localStorage.getItem("regNo");

document.getElementById("user").innerText = `Logged in as: ${userName} (${regNo})`;

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

let hasMarked = false; // prevents duplicate marking per scan

function markAttendance() {
  const user = firebase.auth().currentUser;

  if (!user) {
    alert("❌ You are not logged in. Please login again.");
    window.location.href = "login.html";
    return;
  }

  const now = new Date();

  db.collection("attendance").add({
    uid: user.uid,
    name: userName,
    regNo: regNo,
    time: now
  })

  .then(() => {
    document.getElementById("result").innerText = "✅ Attendance marked";
    hasMarked = false;
  })

  .catch(err => {
    console.error("Attendance error:", err);
    alert("❌ Attendance not saved. Check console.");
    hasMarked = false;
  });
}

function onScanSuccess(decodedText) {
  console.log("QR scanned:", decodedText);
  if (hasMarked) return;
  hasMarked = true;
  markAttendance();
}
// ---------------- Camera Switch Logic ----------------
const html5QrCode = new Html5Qrcode("reader");
let cameras = [];
let currentCameraIndex = 0;
let isSwitching = false; // Prevent multiple clicks during switching

// Start scanning with a specific camera
function startCamera(index) {
  if (!cameras || cameras.length === 0) return;

  const cameraId = cameras[index].id;

  if (html5QrCode.getState() === Html5QrcodeScannerState.NOT_STARTED) {
    // If scanner not started yet, just start
    html5QrCode.start(
      cameraId,
      { fps: 10, qrbox: 250 },
      onScanSuccess,
      errorMessage => console.warn("QR scan error:", errorMessage)
    ).catch(err => console.error("Unable to start camera:", err));
  } else {
    // Stop current camera safely first
    html5QrCode.stop()
      .then(() => {
        return html5QrCode.start(
          cameraId,
          { fps: 10, qrbox: 250 },
          onScanSuccess,
          errorMessage => console.warn("QR scan error:", errorMessage)
        );
      })
      .catch(err => console.error("Error switching camera:", err));
  }
}

// Get all cameras and start default
Html5Qrcode.getCameras()
  .then(camList => {
    if (camList && camList.length) {
      cameras = camList;

      // Default: try to select back camera first
      const backCamIndex = camList.findIndex(c => c.label.toLowerCase().includes("back") || c.label.toLowerCase().includes("rear"));
      currentCameraIndex = backCamIndex >= 0 ? backCamIndex : 0;

      startCamera(currentCameraIndex);
    } else {
      alert("No camera found on this device.");
    }
  })
  .catch(err => console.error("Error getting cameras:", err));

// Switch camera safely
function switchCamera() {
  if (cameras.length < 2 || isSwitching) return;

  isSwitching = true;
  currentCameraIndex = (currentCameraIndex + 1) % cameras.length;

  html5QrCode.stop()
    .then(() => startCamera(currentCameraIndex))
    .finally(() => { isSwitching = false; });
}