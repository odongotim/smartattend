// --- Initial Data ---
let hasMarked = false;

async function markAttendance(qrData) {
  const user = firebase.auth().currentUser;

  // Safety check: Ensure user is logged in
  if (!user) {
    alert("❌ Error: You must be logged in.");
    window.location.href = "login.html";
    return;
  }

  try {
    // 1. Fetch Official Registration Data from 'users' collection
    const userDoc = await db.collection("users").doc(user.uid).get();

    if (!userDoc.exists) {
      console.error("No registration record found in 'users' collection for UID:", user.uid);
      alert("❌ Critical Error: Registration data not found.");
      return;
    }

    const userData = userDoc.data();
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // 2. Define the Document ID (One entry per student per day)
    const docId = `${userData.regNo}_${today}`;
    const docRef = db.collection("attendance").doc(docId);

    // 3. Save the 4 Required Fields + Metadata
    await docRef.set({
      name: userData.name,          // From Registration
      regNo: userData.regNo,        // From Registration
      email: userData.email,        // From Registration
      date: today,                  // Current Date
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      qrInfo: qrData || "Scanned"
    }, { merge: true });

    // Success UI Update
    document.getElementById("result").innerText = `✅ Attendance Recorded for ${userData.name}`;
    document.getElementById("result").style.color = "green";

  } catch (err) {
    console.error("Detailed Error:", err);
    if (err.code === 'permission-denied') {
        alert("❌ Permission Denied: Check your Firebase Rules.");
    } else {
        alert("❌ Error: " + err.message);
    }
    hasMarked = false; // Reset so they can try again
  }
}

// --- QR Scanner Success Handler ---
function onScanSuccess(decodedText) {
  if (hasMarked) return;
  hasMarked = true;
  markAttendance(decodedText);
}

// --- Camera Logic (Same as before) ---
const html5QrCode = new Html5Qrcode("reader");
let cameras = [];
let currentCameraIndex = 0;

function startCamera(index) {
  if (!cameras.length) return;
  html5QrCode.start(
    cameras[index].id,
    { fps: 10, qrbox: 250 },
    onScanSuccess
  ).catch(err => console.error("Scanner Error:", err));
}

Html5Qrcode.getCameras().then(camList => {
  if (camList.length) {
    cameras = camList;
    startCamera(0);
  }
});

function logout() {
  localStorage.clear();
  firebase.auth().signOut().then(() => { window.location.href = "login.html"; });
}