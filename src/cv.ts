import './style.css';

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.innerHTML = `
    <h1>Curriculum Vitae</h1>
    <p>My CV content will go here…</p>
  `;
}
