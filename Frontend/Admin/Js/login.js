 document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorField = document.getElementById('error');

  try {
    const response = await fetch('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok && data.admin) {
    //   alert('Login Successful!');
      localStorage.setItem("admin", JSON.stringify(data.admin));
      window.location.href = "dashboard.html";
      // Redirect to dashboard or load another page here
      // Example: window.location.href = 'dashboard.html';
    } else {
      errorField.textContent = 'Invalid credentials. Please try again.';
    }
  } catch (err) {
    console.error(err);
    errorField.textContent = 'Login failed. Server might be down.';
  }
});
