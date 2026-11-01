function login(username, password) {
  fetch('/auth/login', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
      if (data.success && data.userId) {
          localStorage.setItem('userId', data.userId);
          window.location.href = 'select.html';
      } else {
          alert('localhost:3000 says\nInvalid username or password');
      }
  })
  .catch(error => {
      alert('Login failed: ' + error.message);
  });
}

function skip() {
  localStorage.setItem('userId', 'guest');
  window.location.href = 'select.html';
}

function register(username, password) {
  fetch('/auth/register', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          alert('localhost:3000 says\nUser registered successfully!');
          window.location.href = 'login.html';
      } else {
          alert('Registration failed: ' + data.error);
      }
  })
  .catch(error => {
      alert('Registration failed: ' + error.message);
  });
}

async function addToCart(name, price, image) {
    try {
        const userId = localStorage.getItem('userId') || 'defaultUser';
        const response = await fetch('/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, name, price, image })
        });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
        } else {
            throw new Error(result.error || 'Failed to add to cart');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Error adding to cart: ' + error.message);
    }
}