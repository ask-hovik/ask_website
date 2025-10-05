import './style.css';
import snagle from './snegle.png';

// Home page setup (minimal placeholder)
const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  app.innerHTML = `
    <h1>Welcome</h1>
    <p>
      This is the personal web page of <strong>Ask Haugerud Hovik</strong>.  
      I am a mechanical engineer with an aerospace specialisation, and with a lot of interest 
      in whatever life throws at me.
    </p>
    <p>
      Browse this webpage to know more about me, or to make use of the bits and bobs 
      I have put here and there.
    </p>
    <img src="${snegle}" alt="Just a snail" class="welcome-image" />
  `;
}