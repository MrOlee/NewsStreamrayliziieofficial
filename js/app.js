// =====================================================
// STREAMING RAYLIZIIE - MAIN APPLICATION
// =====================================================

const API_BASE = 'https://api-rayliziie.rayyankrens0304.workers.dev';

// State
let currentPage = 'home';
let isLoading = false;

// DOM Elements
const loadingOverlay = document.getElementById('loadingOverlay');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const themeToggle = document.getElementById('themeToggle');
const playerModal = document.getElementById('playerModal');
const closeModal = document.getElementById('closeModal');
const videoPlayer = document.getElementById('videoPlayer
