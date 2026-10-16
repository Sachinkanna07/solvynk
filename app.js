function joinWaitlist(event) {
  event.preventDefault();
  const email = document.querySelector('#email');
  const message = document.querySelector('#form-message');
  message.textContent = `Thanks — we’ll keep ${email.value} on the list.`;
  email.value = '';
  return false;
}
