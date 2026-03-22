let player;

// Load YouTube API
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);

// Init player
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '300',
    width: '300',
    videoId: '',
    playerVars: {
      autoplay: 1,
      controls: 0,
      enablejsapi: 1
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  });
}

// UI elements
const buttons = document.querySelectorAll('.navBtn');
const indicator = document.querySelector('.indicator');
const playBtn = document.getElementById("play");
const playBtnSmall = document.getElementById("play_small");
const seek = document.getElementById("seek");

const navbar = document.getElementById("navbar");
const expandButton = document.getElementById("expandbutton");
const closeBtn = document.getElementById("closeBtn");

// ---------------- NAV ----------------
buttons.forEach((btn, index) => {
  btn.addEventListener('click', () => {
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const gap = 10;
    const btnWidth = btn.offsetWidth;
    indicator.style.transform = `translateX(${index * (btnWidth + gap)}px)`;
  });
});

// Expand / Collapse
expandButton.addEventListener("click", () => {
  navbar.classList.add("expanded");
});

closeBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  navbar.classList.remove("expanded");
});

// ---------------- PLAYER ----------------
function onPlayerReady(event) {
  event.target.playVideo();

  setInterval(updatePlayerUI, 500);
}

function updatePlayerUI() {
  if (!player || !player.getCurrentTime) return;

  const current = player.getCurrentTime();
  const duration = player.getDuration();

  if (duration > 0) {
    seek.value = (current / duration) * 100;
  }

  // Update time labels
  updateText("current", formatTime(current));
  updateText("duration", formatTime(duration));
  updateText("current_coll", formatTime(current));
  updateText("duration_coll", formatTime(duration));
}

function formatTime(seconds) {
  seconds = Math.floor(seconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function updateText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ---------------- PLAY / PAUSE ----------------
function togglePlayPause() {
  const state = player.getPlayerState();

  if (state === YT.PlayerState.PAUSED) {
    player.playVideo();
    setPauseIcon();
  } else if (state === YT.PlayerState.PLAYING) {
    player.pauseVideo();
    setPlayIcon();
  }
}

function setPlayIcon() {
  playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  playBtnSmall.innerHTML = '<i class="fa-solid fa-play"></i>';
}

function setPauseIcon() {
  playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  playBtnSmall.innerHTML = '<i class="fa-solid fa-pause"></i>';
}

// ---------------- SEEK ----------------
seek.addEventListener("input", () => {
  if (!player || !player.getDuration) return;

  const duration = player.getDuration();
  const seekTo = (seek.value / 100) * duration;

  player.seekTo(seekTo, true);
});

// ---------------- LOAD VIDEO ----------------
function loadVideo(videoId) {
  player.loadVideoById(videoId);
  setPauseIcon();
  updateVideoDetails();
  // Delay to ensure data is ready
  setTimeout(updateVideoDetails, 500);
}

function updateVideoDetails() {
  const data = player.getVideoData();
  console.log(data);
  if (!data) return;

  updateText("songname_ex", data.title);
  updateText("auth_ex", data.author);
  updateText("title_coll", data.title);
  updateText("auth_coll", data.author);

  updateThumbnail();
}

// ---------------- THUMBNAIL ----------------
function updateThumbnail() {
  const data = player.getVideoData();
  if (!data || !data.video_id) return;

  const thumb = `https://img.youtube.com/vi/${data.video_id}/maxresdefault.jpg`;

  document.getElementById("aart_expanded").src = thumb;
  document.getElementById("aart_coll").src = thumb;
}

// ---------------- PLAYER STATE ----------------
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    setPauseIcon();
  } else if (event.data === YT.PlayerState.PAUSED) {
    setPlayIcon();
  }
}

// ---------------- AUTH ----------------
function Authenticate() {
  const clientId = '751698155813-eh0tesk9hj54bmliki1coi1hjmd8au3t.apps.googleusercontent.com';
  const redirectUri = 'https://127.0.0.1:5500/index.html';
  const scope = 'https://www.googleapis.com/auth/youtube.force-ssl';

  const url =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=token` +
    `&scope=${scope}`;

  window.location.href = url;
}

function getAccessTokenFromUrl() {
  const params = new URLSearchParams(window.location.hash.substring(1));
  return params.get("access_token");
}

function setToken() {
  const token = getAccessTokenFromUrl();

  if (token) {
    localStorage.setItem("accessToken", token);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}


function getUserInfo() {
  console.log("getUserInfo called");
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    console.error("No access token found");
    return;
  }

  fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (!data.items || !data.items.length) {
        console.error("No channel found or invalid token");
        return;
      }
      const channel = data.items[0];
      document.getElementById("displayname").innerHTML = `Good Morning, ${channel.snippet.title}`;
      document.getElementById("dp").src = channel.snippet.thumbnails.default.url;
    })
    .catch((error) => {
      console.error("Error fetching user info:", error);
    });
}