const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.remove();
};
const showAlert = (type, msg, time = 3000) => {
  hideAlert();
  const markup = `<div class='alert alert--${type}'>${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  setTimeout(() => {
    hideAlert();
  }, time);
};

const alertMessage = document.querySelector('body')?.dataset?.alert;

if (alertMessage) {
  showAlert('success', alertMessage, 7000);
}

export default showAlert;
