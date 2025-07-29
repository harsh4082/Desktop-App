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
    data.classes.forEach(cls => {
      const li = document.createElement('li');
      li.textContent = `${cls.name} - ${cls.studentCount} students`;
      classList.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    document.querySelector('.container').innerHTML = '<p style="color:red;">Failed to load department details.</p>';
  }
};
