import showAlert from './alert';

const stripe = Stripe(
  'pk_test_51PLMsxGtZnY7oDCp2dbcfFYGBqftzJisk290LPQtdyDDUsCpme5OzLjAttVNLXgqzYrAgzenlmUTg9mCedgXIyKz002gViBhmF',
);
const bookTour = async (tourId) => {
  try {
    // 1) get session from API
    const response = await fetch(`/api/v1/bookings/checkout-session/${tourId}`);

    const session = await response.json();

    if (session.status === 'fail') {
      throw new Error(session.message);
    }

    if (session.status === 'success') {
      // 2) create checkout form + charge credit card
      stripe.redirectToCheckout({
        sessionId: session.session.id,
      });
    }
  } catch (err) {
    showAlert('error', err?.message);
  }
};

const btn = document.getElementById('book-tour');
if (btn) {
  btn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const tourId = btn.dataset.tourId;
    bookTour(tourId);
  });
}
