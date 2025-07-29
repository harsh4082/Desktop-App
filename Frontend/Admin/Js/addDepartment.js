const classes = [];

function renderClasses() {
  const container = document.getElementById('classesContainer');
  container.innerHTML = ''; // clear old

  classes.forEach((cls, index) => {
    const row = document.createElement('div');
    row.style.marginBottom = '10px';

    row.innerHTML = `
      <input type="text" value="${cls.name}" placeholder="Class Name" data-index="${index}" class="class-name" required />
      <input type="number" value="${cls.studentCount}" placeholder="Student Count" data-index="${index}" class="student-count" required />
    `;

    container.appendChild(row);
  });
}

document.getElementById('addClassBtn').addEventListener('click', () => {
  classes.push({ name: '', studentCount: 0 });
  renderClasses();
});

document.getElementById('classesContainer').addEventListener('input', (e) => {
  const index = e.target.getAttribute('data-index');
  const field = e.target.classList.contains('class-name') ? 'name' : 'studentCount';
  classes[index][field] = field === 'studentCount' ? parseInt(e.target.value) : e.target.value;
});

document.getElementById('deptForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const hod = document.getElementById('hod').value.trim();
  const message = document.getElementById('message');

  try {
    const response = await fetch('http://localhost:3000/api/dept/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, hod, classes })
    });

    const data = await response.json();

    if (response.ok) {
      message.textContent = "Department added successfully!";
      message.style.color = "green";
    } else {
      message.textContent = data.message || "❌ Failed to add department.";
      message.style.color = "red";
    }
  } catch (err) {
    console.error(err);
    message.textContent = "Server error.";
    message.style.color = "red";
  }
});
