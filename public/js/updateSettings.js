const updateData = async (name, email) => {
  try {
    const response = await fetch(
      'http://localhost:8000/api/v1/users/updateMe',
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
        }),
      },
    );
    const res = await response.json();

    if (res.status === 'success') {
      showAlert('success', 'Data updated successfully');
    }

    if (res.status === 'error') {
      throw new Error(res?.message);
    }
  } catch (err) {
    showAlert('error', err.message);
  }
};

const userDataForm = document.querySelector('.form-user-data');

if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    const name = userDataForm.querySelector('#name').value;
    const email = userDataForm.querySelector('#email').value;
    e.preventDefault();
    updateData(name, email);
  });
}
