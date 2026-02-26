// ---------------- USER INFO ----------------
const userName = localStorage.getItem("name");
const regNo = localStorage.getItem("regNo");

document.getElementById("user").innerText =
  `Logged in as: ${userName} (${regNo})`;

let hasMarked = false;

// ---------------- ATTENDANCE ----------------
function markAttendance() {
  const user = firebase.auth().currentUser;

  if (!user) {
    alert("Session expired. Login again.");
    window.location.href = "login.html";
    return;
  }

  if (hasMarked) return;
  hasMarked = true;

  db.collection("attendance").add({
    uid: user.uid,
    name: userName,
    regNo: regNo,
    time: new Date()
  })
  .then(() => {
    document.getElementById("result").innerText = "✅ Attendance marked";
    setTimeout(() => hasMarked = false, 3000);
  })
  .catch(err => {
    console.error("Firestore error:", err);
    hasMarked = false;
  });
}

function onScanSuccess(decodedText) {
  console.log("QR scanned:", decodedText);
  markAttendance();
}

// ---------------- QR CAMERA (STABLE) ----------------
const html5QrCode = new Html5Qrcode("reader");
let cameras = [];
let currentCameraIndex = 0;
let scannerRunning = false;

// START CAMERA (ONLY ONCE)
function startCamera(cameraId) {
  if (scannerRunning) return;

  html5QrCode.start(
    cameraId,
    { fps: 10, qrbox: 280 },
    onScanSuccess
  ).then(() => {
    scannerRunning = true;
    console.log("Camera started");
  }).catch(err => {
    console.error("Camera start error:", err);
  });
}

// LOAD CAMERAS
Html5Qrcode.getCameras().then(camList => {
  if (!camList.length) {
    alert("No camera found");
    return;
  }

  cameras = camList;

  // Prefer back camera
  const backIndex = camList.findIndex(c =>
    c.label.toLowerCase().includes("back")
  );

  currentCameraIndex = backIndex >= 0 ? backIndex : 0;

  startCamera(cameras[currentCameraIndex].id);
});

// ---------------- SWITCH CAMERA (SAFE) ----------------
function switchCamera() {
  if (cameras.length < 2) return;

  html5QrCode.stop().then(() => {
    scannerRunning = false;
    currentCameraIndex = (currentCameraIndex + 1) % cameras.length;
    startCamera(cameras[currentCameraIndex].id);
  });
}