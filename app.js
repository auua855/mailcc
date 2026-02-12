// Configuration
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';
// User needs to replace this with their own Client ID
let CLIENT_ID = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';

// State
let tokenClient;
let gapiInited = false;
let gisInited = false;
let accessToken = null;
let currentRange = 'week'; // 'week' | 'month'

// UI Elements
const authBtn = document.getElementById('auth-btn');
const authContainer = document.getElementById('auth-container');
const appControls = document.getElementById('app-controls');
const emailList = document.getElementById('email-list');
const loadingSpinner = document.getElementById('loading');
const errorMsg = document.getElementById('error-msg');
const authStatus = document.getElementById('auth-status');
const slider = document.getElementById('slider');
const btnWeek = document.getElementById('btn-week');
const btnMonth = document.getElementById('btn-month');

// Initialization
function checkAuth() {
    if (gapiInited && gisInited) {
        authContainer.classList.remove('hidden');
    }
}

function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        // apiKey: API_KEY, // Optional for this scope if using OAuth 2.0
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
    });
    gapiInited = true;
    checkAuth();
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (resp) => {
            if (resp.error !== undefined) {
                throw (resp);
            }
            accessToken = resp.access_token;
            handleAuthSuccess();
        },
    });
    gisInited = true;
    checkAuth();
}

// Event Listeners
authBtn.addEventListener('click', handleAuthClick);

function handleAuthClick() {
    // Check if CLIENT_ID is still the placeholder
    if (CLIENT_ID === 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com') {
        const inputId = prompt('Please enter your Google Cloud Client ID:', '');
        if (inputId) {
            CLIENT_ID = inputId;
            // Re-init token client with new ID
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (resp) => {
                    if (resp.error !== undefined) {
                        throw (resp);
                    }
                    accessToken = resp.access_token;
                    handleAuthSuccess();
                },
            });
            tokenClient.requestAccessToken();
        } else {
            alert('Client ID is required to sign in.');
        }
    } else {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    }
}

function handleAuthSuccess() {
    authContainer.classList.add('hidden');
    appControls.classList.remove('hidden');
    authStatus.textContent = 'Signed In';
    authStatus.classList.add('text-green-600');
    // Save Client ID to local storage for convenience
    localStorage.setItem('gmail_viewer_client_id', CLIENT_ID);
}

// Load saved Client ID
const savedClientId = localStorage.getItem('gmail_viewer_client_id');
if (savedClientId) {
    CLIENT_ID = savedClientId;
}

// Logic
function setRange(range) {
    currentRange = range;
    if (range === 'week') {
        slider.style.transform = 'translateX(0)';
        btnWeek.classList.remove('text-gray-500');
        btnMonth.classList.add('text-gray-500');
    } else {
        slider.style.transform = 'translateX(100%)';
        btnWeek.classList.add('text-gray-500');
        btnMonth.classList.remove('text-gray-500');
    }
}

async function searchEmails() {
    emailList.innerHTML = '';
    loadingSpinner.classList.remove('hidden');
    errorMsg.classList.add('hidden');

    try {
        const dateQuery = getDateQuery(currentRange);
        const query = `is:unread ${dateQuery}`;

        const response = await gapi.client.gmail.users.messages.list({
            'userId': 'me',
            'q': query,
            'maxResults': 20 // Limit for demo
        });

        const messages = response.result.messages;

        if (!messages || messages.length === 0) {
            emailList.innerHTML = '<div class="text-center text-gray-500 py-4">No unread messages found within this range.</div>';
            return;
        }

        // Fetch details for each message
        const batch = gapi.client.newBatch();
        messages.forEach(msg => {
            batch.add(gapi.client.gmail.users.messages.get({
                'userId': 'me',
                'id': msg.id,
                'format': 'metadata', // metadata is faster, includes headers and snippet
                'metadataHeaders': ['Subject', 'From', 'Date']
            }));
        });

        // Current batch implementation in GAPI client might be tricky with promises, 
        // fallback to parallel requests for simplicity in this demo environment if batch feels flaky,
        // but batch is better. Let's try Promise.all with individual requests for clarity/reliability in modern JS.

        const details = await Promise.all(messages.map(msg =>
            gapi.client.gmail.users.messages.get({
                'userId': 'me',
                'id': msg.id,
                'format': 'full'
            })
        ));

        // Render
        details.forEach((res, index) => {
            const msg = res.result;
            const headers = msg.payload.headers;
            const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
            const snippet = msg.snippet;

            const el = document.createElement('div');
            el.className = 'bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-1 active:scale-[0.99] transition-transform details-enter';
            el.style.animationDelay = `${index * 50}ms`;
            el.innerHTML = `
                <div class="font-bold text-gray-800 text-sm truncate">${subject}</div>
                <div class="text-xs text-gray-500 line-clamp-2 leading-relaxed">${snippet}</div>
            `;
            emailList.appendChild(el);

            // Trigger animation
            requestAnimationFrame(() => el.classList.add('details-enter-active'));
        });

    } catch (err) {
        console.error('Error searching emails', err);
        errorMsg.textContent = 'Error fetching emails. Please check console or try again.';
        errorMsg.classList.remove('hidden');
    } finally {
        loadingSpinner.classList.add('hidden');
    }
}

function getDateQuery(range) {
    const date = new Date();
    if (range === 'week') {
        date.setDate(date.getDate() - 7);
    } else {
        date.setMonth(date.getMonth() - 1);
    }

    // Format YYYY/MM/DD
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    return `after:${yyyy}/${mm}/${dd}`;
}

// Load libraries
const script1 = document.createElement('script');
script1.src = 'https://apis.google.com/js/api.js';
script1.onload = gapiLoaded;
document.head.appendChild(script1);

const script2 = document.createElement('script');
script2.src = 'https://accounts.google.com/gsi/client';
script2.onload = gisLoaded;
document.head.appendChild(script2);
