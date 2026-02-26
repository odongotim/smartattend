// Firebase already initialized
const userName = localStorage.getItem("name");
const regNo = localStorage.getItem("regNo");

document.getElementById("user").innerText = `Logged in as: ${userName} (${regNo})`;

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

function markAttendance() {
  db.collection("attendance").add({
    name: userName,
    regNo: regNo,
    time: new Date()
  })
  .then(() => alert("Attendance marked!"))
  .catch(err => console.error(err));
}

function onScanSuccess(decodedText, decodedResult) {
  document.getElementById("result").innerText = decodedText;
  markAttendance();
}

// ---------------- Camera & QR Scanner Logic ----------------
const html5QrCode = new Html5Qrcode("reader");
let cameras = [];
let currentCameraIndex = 0;
let isSwitching = false;

// Calculate optimal QR box size
function getQrBoxSize() {
  const minDimension = Math.min(window.innerWidth, window.innerHeight);
  return Math.floor(minDimension * 0.7); // 70% of smaller screen dimension
}

// Start scanning with a specific camera
function startCamera(index) {
  if (!cameras || cameras.length === 0) return;

  const cameraId = cameras[index].id;
  const qrBoxSize = getQrBoxSize();

  // Stop current camera safely
  html5QrCode.stop()
    .finally(() => {
      html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: qrBoxSize,
          disableFlip: false,  // allow front camera QR detection
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
          verbose: false
        },
        onScanSuccess,
        errorMessage => console.warn("QR scan error:", errorMessage)
      ).catch(err => console.error("Unable to start camera:", err));
    });
}

// Get all cameras and start default
Html5Qrcode.getCameras()
  .then(camList => {
    if (camList && camList.length) {
      cameras = camList;

      // Try to select back camera first
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
    .finally(() => {
      startCamera(currentCameraIndex);
      isSwitching = false;
    });
}

// Resize QR box on orientation change
window.addEventListener("resize", () => {
  if (html5QrCode.getState() === Html5QrcodeScannerState.SCANNING) {
    startCamera(currentCameraIndex);
  }
});