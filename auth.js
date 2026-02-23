function signup() {
  const user = {
    name: document.getElementById("name").value,
    reg: document.getElementById("reg").value,
    email: document.getElementById("email").value
  };

  if(!user.name || !user.reg || !user.email){
    alert("Fill all fields");
    return;
  }

  localStorage.setItem("attendanceUser", JSON.stringify(user));
  window.location.href = "scan.html";
}