document.addEventListener('DOMContentLoaded', () => {
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
