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
  db.collection("attendance").add({
    name: userName,
    regNo: regNo,
    time: new Date()
  })
  .then(() => {
    alert("✅ Attendance successfully marked!");
    hasMarked = false; // ready for next scan
  })
  .catch(err => {
    console.error("Error marking attendance:", err);
    alert("❌ Failed to mark attendance. Try again.");
    hasMarked = false;
  });
}

function onScanSuccess(decodedText, decodedResult) {
  if (hasMarked) return; // ignore duplicate scan
  hasMarked = true;

  document.getElementById("result").innerText = decodedText;
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