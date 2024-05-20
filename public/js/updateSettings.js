const updateSettings = async (data, type) => {
  const endpoint = type === 'Data' ? 'updateMe' : 'updateMyPassword';
  try {
    const response = await fetch(
      `http://localhost:8000/api/v1/users/${endpoint}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    );
    const res = await response.json();
    console.log('res --> ', res);
    if (res.status === 'success') {
      showAlert('success', `${type} updated successfully`);
    } else if (res.status === 'error' || res.status === 'fail') {
      throw new Error(res?.message);
    }
  } catch (err) {
    showAlert('error', err.message);
  }
};

const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');

if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    const name = userDataForm.querySelector('#name').value;
    const email = userDataForm.querySelector('#email').value;
    e.preventDefault();
    updateSettings({ name, email }, 'Data');
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const passwordCurrent =
      userPasswordForm.querySelector('#password-current').value;
    const confirmPassword =
      userPasswordForm.querySelector('#password-confirm').value;
    const password = userPasswordForm.querySelector('#password').value;
    const btn = userPasswordForm.querySelector('.btn');

    btn.textContent = 'Updating...';
    await updateSettings(
      { passwordCurrent, password, confirmPassword },
      'Password',
    );

    userPasswordForm.querySelector('#password-current').value = '';
    userPasswordForm.querySelector('#password-confirm').value = '';
    userPasswordForm.querySelector('#password').value = '';
    btn.textContent = 'Save password';
  });
}
