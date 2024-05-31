import showAlert from './alert'

const updateSettings = async (data, type) => {
  const endpoint = type === 'Data' ? 'updateMe' : 'updateMyPassword';
  try {
    const response = await fetch(`/api/v1/users/${endpoint}`, {
      method: 'PATCH',
      headers:
        type === 'Data'
          ? {}
          : {
              'Content-Type': 'application/json',
            },
      body: type === 'Data' ? data : JSON.stringify(data),
    });
    const res = await response.json();
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
    e.preventDefault();
    const form = new FormData();
    const name = userDataForm.querySelector('#name').value;
    const email = userDataForm.querySelector('#email').value;
    const photo = document.getElementById('photo').files[0];

    form.append('name', name);
    form.append('email', email);
    form.append('photo', photo);

    updateSettings(form, 'Data');
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
