document.addEventListener('DOMContentLoaded', () => {
  const authOverlay = document.querySelector('#auth-overlay');
  const authForm = document.querySelector('#auth-form');
  const authMessage = document.querySelector('#auth-message');
  const nameInput = document.querySelector('#auth-name');
  const nameLabel = document.querySelector('#name-label');
  const title = document.querySelector('#auth-title');
  const subtitle = document.querySelector('#auth-subtitle');
  const submit = document.querySelector('#auth-submit');
  let mode = 'login';

  const openAuth = () => {
    authOverlay.classList.add('visible');
    authOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('auth-open');
  };

  const closeAuth = () => {
    authOverlay.classList.remove('visible');
    authOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('auth-open');
  };

  const setMode = (nextMode) => {
    mode = nextMode;
    const signup = mode === 'signup';
    document.querySelector('#login-tab').classList.toggle('active', !signup);
    document.querySelector('#signup-tab').classList.toggle('active', signup);
    nameInput.classList.toggle('hidden', !signup);
    nameLabel.classList.toggle('hidden', !signup);
    nameInput.required = signup;
    title.textContent = signup ? 'Join the sound' : 'Welcome back';
    subtitle.textContent = signup ? 'Create an account and make the music yours.' : 'Log in to keep your music within reach.';
    submit.textContent = signup ? 'Create account' : 'Log in';
    authMessage.textContent = '';
  };

  document.querySelector('#user-button').addEventListener('click', openAuth);
  document.querySelector('#auth-close').addEventListener('click', closeAuth);
  document.querySelector('#login-tab').addEventListener('click', () => setMode('login'));
  document.querySelector('#signup-tab').addEventListener('click', () => setMode('signup'));
  authOverlay.addEventListener('click', (event) => {
    if (event.target === authOverlay) closeAuth();
  });

  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    authMessage.textContent = '';
    submit.disabled = true;
    const formData = new FormData(authForm);
    const payload = { email: formData.get('email'), password: formData.get('password') };
    if (mode === 'signup') payload.name = formData.get('name');
    try {
      const response = await fetch(`/api/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Something went wrong.');
      localStorage.setItem('spotify-user', JSON.stringify(result.user));
      authMessage.className = 'auth-message success';
      authMessage.textContent = `Welcome, ${result.user.name}.`;
      setTimeout(closeAuth, 500);
    } catch (error) {
      authMessage.className = 'auth-message error';
      authMessage.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });

  if (!localStorage.getItem('spotify-user')) openAuth();

  const clickable = document.querySelectorAll('.song, .card[data-title]');
  clickable.forEach(s => {
    s.style.cursor = 'pointer';
    s.addEventListener('click', async () => {
      const title = (s.dataset && s.dataset.title) || s.textContent || '';
      const artist = (s.dataset && s.dataset.artist) || '';
      const query = `${title} ${artist}`.trim();

      // If user provided an API key in config.js and replaced placeholder, use YouTube Data API
      if (typeof YT_API_KEY !== 'undefined' && YT_API_KEY && YT_API_KEY !== 'YOUR_API_KEY_HERE') {
        try {
          const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(query)}&key=${YT_API_KEY}`;
          const res = await fetch(apiUrl);
          const data = await res.json();
          const vid = data.items && data.items[0] && data.items[0].id && data.items[0].id.videoId;
          if (vid) {
            // Redirect to the video watch page (autoplay may be blocked by browser policies)
            window.location.href = `https://www.youtube.com/watch?v=${vid}&autoplay=1`;
            return;
          }
        } catch (err) {
          console.error('YouTube API error:', err);
        }
      }

      // Fallback: open YouTube search results for the query
      window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    });
  });

  
});
