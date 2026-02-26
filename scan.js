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

// ---------------- Camera Switch Logic ----------------
const html5QrCode = new Html5Qrcode("reader");
let cameras = [];
let currentCameraIndex = 0;

// Start scanning with a specific camera
function startCamera(index) {
  if (!cameras || cameras.length === 0) return;

  const cameraId = cameras[index].id;

  // Stop current camera first (if running)
  html5QrCode.stop().finally(() => {
    html5QrCode.start(
      cameraId,
      { fps: 10, qrbox: 250 },
      onScanSuccess,
      errorMessage => console.warn("QR scan error:", errorMessage)
    ).catch(err => {
      console.error("Unable to start camera:", err);
      alert("Camera not accessible. Make sure you allow permission.");
    });
  });
}

// Get all cameras
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

// Switch camera
function switchCamera() {
  if (cameras.length < 2) return; // only one camera available
  currentCameraIndex = (currentCameraIndex + 1) % cameras.length;
  startCamera(currentCameraIndex);
}