window.onload = function () {
  const admin = JSON.parse(localStorage.getItem("admin"));
  if (admin) {
    document.getElementById("adminName").textContent = `Welcome, ${admin.name} (${admin.username})`;
  } else {
    window.location.href = "login.html"; // force logout if no session
  }
};
