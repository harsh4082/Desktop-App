window.onload = async function () {
  const deptId = localStorage.getItem('selectedDepartmentId');

  if (!deptId) {
    alert("No department selected.");
    window.location.href = 'viewDepartments.html';
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/dept/department/${deptId}`);
    const data = await response.json();

    document.getElementById('deptName').textContent = data.name;
    document.getElementById('hod').textContent = data.hod;

    const classList = document.getElementById('classList');
    const classSelect = document.getElementById('classSelect');

    data.classes.forEach(cls => {
      const li = document.createElement('li');
      li.textContent = `${cls.name} - ${cls.studentCount} students`;
      classList.appendChild(li);

      const option = document.createElement('option');
      option.value = cls.name;
      option.textContent = cls.name;
      classSelect.appendChild(option);
    });

    document.getElementById('subjectForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('subjectName').value;
      const className = document.getElementById('classSelect').value;
      const teacherName = document.getElementById('teacherName').value;
      const setsInput = document.getElementById('setsInput').value;

      const sets = setsInput.split(',').map(set => ({
        name: set.trim(),
        students: 0
      }));

      const payload = {
        name,
        class: className,
        teacherName,
        departmentId: deptId,
        totalStudents: 0,
        sets
      };

      try {
        const res = await fetch("http://localhost:3000/api/subject/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        await res.json();
        document.getElementById('message').textContent = "✅ Subject added successfully!";
        document.getElementById('subjectForm').reset();
        fetchSubjects();
      } catch (err) {
        console.error(err);
        document.getElementById('message').textContent = "❌ Failed to add subject.";
      }
    });

    fetchSubjects();

  } catch (err) {
    console.error(err);
    document.querySelector('.container').innerHTML = '<p style="color:red;">Failed to load department details.</p>';
  }

  async function fetchSubjects() {
    try {
      const res = await fetch(`http://localhost:3000/api/subject/by-department/${localStorage.getItem('selectedDepartmentId')}`);
      const subjects = await res.json();

      const container = document.getElementById('subjectCards');
      container.innerHTML = '';

      subjects.forEach(sub => {
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.innerHTML = `
          <h4>${sub.name} (${sub.class})</h4>
          <p><strong>Teacher:</strong> ${sub.teacherName}</p>
          <p><strong>Total Students:</strong> ${sub.totalStudents}</p>
          <p><strong>Status:</strong> ${sub.status}</p>
          <div><strong>Sets:</strong>
            <ul>${sub.sets.map(set => `<li>${set.name}: ${set.students} students</li>`).join('')}</ul>
          </div>
        `;
        container.appendChild(card);
      });

    } catch (err) {
      console.error("Failed to fetch subjects", err);
    }
  }
};
