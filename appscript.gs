const ATTENDANCE = "Attendance";
const SETTINGS = "Settings";

function doPost(e){
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActive();

  if (data.action === "scan") {
    const sh = ss.getSheetByName(ATTENDANCE) || ss.insertSheet(ATTENDANCE);
    sh.appendRow([new Date(), data.qrData]);
    return ok("saved");
  }

  if (data.action === "saveSettings") {
    const sh = ss.getSheetByName(SETTINGS) || ss.insertSheet(SETTINGS);
    sh.clear().appendRow(["Lat","Lng","Radius","Date"]);
    sh.appendRow([data.lat,data.lng,data.radius,new Date()]);
    return ok("settings saved");
  }
}

function ok(msg){
  return ContentService.createTextOutput(msg);
}