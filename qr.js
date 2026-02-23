// Save admin-updated venue location & radius
function saveLocation() {
  const lat = parseFloat(document.getElementById("venueLat").value);
  const lng = parseFloat(document.getElementById("venueLng").value);
  const radius = parseFloat(document.getElementById("venueRadius").value);

  if(isNaN(lat) || isNaN(lng) || isNaN(radius)) {
    alert("Please enter valid numbers");
    return;
  }

  // THIS is where you put your Web App URL
  fetch("https://script.google.com/macros/s/AKfycby7lDB1nEMEbSrmx45oHZTpiI-cGr9FBGGANfSnt3bllYWtGaPAsQzCmfdJnqtb-Nj8/exec", {
    method: "POST",
    body: JSON.stringify({
      action: "saveSettings",
      lat: lat,
      lng: lng,
      radius: radius
    })
  })
  .then(res => res.text())
  .then(response => {
    if(response === "settings_saved"){
      alert("Venue location and radius saved successfully!");
    } else {
      alert("Error saving settings");
    }
  });
}