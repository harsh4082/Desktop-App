window.onload = async function () {
  const container = document.getElementById('departments');

  try {
    const response = await fetch('http://localhost:3000/api/dept/names');
    const data = await response.json();

    data.forEach(dept => {
      const card = document.createElement('div');
      card.className = 'card';
      card.textContent = dept.name;
      card.onclick = () => {
        localStorage.setItem('selectedDepartmentId', dept.departmentId);
        window.location.href = 'departmentDetails.html';
      };
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = '<p style="color:red;">Failed to load departments.</p>';
    console.error(err);
  }
};
