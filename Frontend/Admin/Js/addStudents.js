let selectedDeptId = null;

window.onload = async function () {
  loadDepartments();
};

async function loadDepartments() {
  const res = await fetch("http://localhost:3000/api/dept/names");
  const departments = await res.json();

  const container = document.getElementById("departmentCards");
  container.innerHTML = "";
  departments.forEach(dept => {
    const card = document.createElement("div");
    card.className = "card";
    card.textContent = dept.name;
    card.onclick = () => selectDepartment(dept.departmentId);
    container.appendChild(card);
  });
}

async function selectDepartment(departmentId) {
  selectedDeptId = departmentId;

  document.getElementById("departmentCards").classList.add("hidden");
  document.getElementById("pageTitle").textContent = "Add Students";
  document.querySelector(".back-button").classList.remove("hidden");

  const res = await fetch(`http://localhost:3000/api/dept/classes/${departmentId}`);
  const classList = await res.json();

  const classSelect = document.getElementById("classSelect");
  classSelect.innerHTML = "";
  classList.forEach(cls => {
    const option = document.createElement("option");
    option.value = cls.name;
    option.textContent = `${cls.name} (${cls.studentCount} students)`;
    classSelect.appendChild(option);
  });

  document.getElementById("classContainer").classList.remove("hidden");
  document.getElementById("uploadContainer").classList.remove("hidden");
}

function goBack() {
  document.getElementById("pageTitle").textContent = "Select Department";
  document.getElementById("departmentCards").classList.remove("hidden");
  document.querySelector(".back-button").classList.add("hidden");

  document.getElementById("classContainer").classList.add("hidden");
  document.getElementById("uploadContainer").classList.add("hidden");
  document.getElementById("responseMessage").textContent = "";
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim());
    let student = {};
    headers.forEach((header, i) => {
      student[header] = values[i];
    });
    student.departmentId = selectedDeptId;
    student.class = document.getElementById("classSelect").value;
    return student;
  });
}

async function submitCSV() {
  const fileInput = document.getElementById("csvFile");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select a CSV file.");
    return;
  }

  const text = await file.text();
  const students = parseCSV(text);

  const res = await fetch("http://localhost:3000/api/students/add-multiple", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(students),
  });

  const result = await res.json();
  const message = result.message || "✅ Students uploaded successfully!";
  document.getElementById("responseMessage").textContent = message;

  fileInput.value = ""; // Reset input
}
