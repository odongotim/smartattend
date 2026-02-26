// Get data from localStorage
const userName = localStorage.getItem("name");
const regNo = localStorage.getItem("regNo");

// Display user info
if (userName && regNo) {
    document.getElementById("user").innerText = `Logged in as: ${userName} (${regNo})`;
}

function logout() {
    localStorage.clear();
    firebase.auth().signOut().then(() => {
        window.location.href = "login.html";
    });
}

let hasMarked = false; // prevents duplicate marking per scan

async function markAttendance(qrData) {
  const user = firebase.auth().currentUser;

  if (!user) {
    alert("❌ You are not logged in.");
    return;
  }

  // 1. Get the start and end of the current day
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  try {
    // 2. Check if this regNo already has a record for TODAY
    const existingRecords = await db.collection("attendance")
      .where("regNo", "==", regNo)
      .where("time", ">=", startOfDay)
      .where("time", "<=", endOfDay)
      .get();

    if (!existingRecords.empty) {
      document.getElementById("result").innerText = "⚠️ Already marked for today!";
      document.getElementById("result").style.color = "orange";
      hasMarked = false; // Reset scanner lock so they can try again if it was a mistake
      return;
    }

    // 3. If no record exists, save the attendance
    await db.collection("attendance").add({
      uid: user.uid,
      name: userName,
      regNo: regNo,
      scanData: qrData,
      time: firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById("result").innerText = "Attendance marked successfully!";
    document.getElementById("result").style.color = "green";

  } catch (err) {
    console.error("Error:", err);
    alert("Error checking/saving attendance.");
    hasMarked = false;
  }
}

function onScanSuccess(decodedText) {
    console.log("QR scanned:", decodedText);
    if (hasMarked) return;
    hasMarked = true;
    
    // Pass the scanned text to the marking function
    markAttendance(decodedText);
}

// ---------------- Camera Switch Logic ----------------
const html5QrCode = new Html5Qrcode("reader");
let cameras = [];
let currentCameraIndex = 0;
let isSwitching = false;

function startCamera(index) {
    if (!cameras || cameras.length === 0) return;

    const cameraId = cameras[index].id;

    html5QrCode.start(
        cameraId,
        { fps: 10, qrbox: 250 },
        onScanSuccess,
        errorMessage => { /* Silently catch scan noise */ }
    ).catch(err => console.error("Unable to start camera:", err));
}

// Get all cameras and start default
Html5Qrcode.getCameras()
    .then(camList => {
        if (camList && camList.length) {
            cameras = camList;
            // Default: try to select back camera first
            const backCamIndex = camList.findIndex(c => 
                c.label.toLowerCase().includes("back") || 
                c.label.toLowerCase().includes("rear")
            );
            currentCameraIndex = backCamIndex >= 0 ? backCamIndex : 0;
            startCamera(currentCameraIndex);
        } else {
            alert("No camera found on this device.");
        }
    })
    .catch(err => console.error("Error getting cameras:", err));

function switchCamera() {
    if (cameras.length < 2 || isSwitching) return;

    isSwitching = true;
    currentCameraIndex = (currentCameraIndex + 1) % cameras.length;

    html5QrCode.stop()
        .then(() => startCamera(currentCameraIndex))
        .catch(err => console.error("Switch error:", err))
        .finally(() => { isSwitching = false; });
}