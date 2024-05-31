import showAlert from './alert'

const login = async (email, password) => {
  try {
    const response = await fetch('/api/v1/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const res = await response.json();
    if (res.status === 'fail') {
      throw new Error(res.message);
    }

    if (res.status === 'success') {
      showAlert('success', 'Logged in Successfully');
      location.assign('/');
    }
  } catch (err) {
    showAlert('error', err?.message);
  }
};

const logout = async () => {
  try {
    const response = await fetch('/api/v1/users/logout');
    const res = await response.json();

    if (res.status === 'success') {
      location.reload(true);
    }

    if (res.status === 'fail') {
      throw new Error(res.message);
    }
  } catch (err) {
    showAlert('error', err?.message);
  }
};

const form = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}
