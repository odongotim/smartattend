// Firebase already initialized in scan.html
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

// --- Camera Switching Logic ---
const html5QrCode = new Html5Qrcode("reader");
let currentCameraIndex = 0;
let cameras = [];

function startCamera(index) {
  if (!cameras || cameras.length === 0) return;
  
  const cameraId = cameras[index].id;
  html5QrCode.stop().catch(() => {}); // stop any running camera first
  html5QrCode.start(
    cameraId,
    { fps: 10, qrbox: 250 },
    onScanSuccess,
    errorMessage => console.warn("QR scan error:", errorMessage)
  ).catch(err => {
    console.error("Unable to start camera:", err);
    alert("Camera not accessible. Make sure you allow permission.");
  });
}

// Get available cameras
Html5Qrcode.getCameras().then(camList => {
  if (camList && camList.length) {
    cameras = camList;
    startCamera(currentCameraIndex); // start first camera
  } else {
    alert("No camera found on this device.");
  }
}).catch(err => console.error("Error getting cameras:", err));

// Switch camera function
function switchCamera() {
  if (cameras.length < 2) return; // only one camera
  currentCameraIndex = (currentCameraIndex + 1) % cameras.length;
  startCamera(currentCameraIndex);
}