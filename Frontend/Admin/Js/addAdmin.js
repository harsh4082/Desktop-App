document.getElementById('adminForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const message = document.getElementById('message');

  try {
    const response = await fetch('http://localhost:3000/api/admin/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, password })
    });

    const data = await response.json();

    if (response.ok) {
      message.textContent = "Admin added successfully!";
      message.style.color = "green";
    } else {
      message.textContent = data.message || "❌ Failed to add admin.";
      message.style.color = "red";
    }
  } catch (err) {
    console.error(err);
    message.textContent = "Server error.";
    message.style.color = "red";
  }
});
