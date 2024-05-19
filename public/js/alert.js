const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.remove();
};
const showAlert = (type, msg) => {
  hideAlert();
  const markup = `<div class='alert alert--${type}'>${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  setTimeout(() => {
    hideAlert();
  }, 2000);
};
