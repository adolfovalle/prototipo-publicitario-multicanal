importScripts('https://www.gstatic.com/firebasejs/7.14.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.14.2/firebase-messaging.js');
var firebaseConfig = {
    apiKey: "REPLACE_API_KEY",
    authDomain: "prototipo-52ab7.firebaseapp.com",
    databaseURL: "https://prototipo-52ab7.firebaseio.com",
    projectId: "prototipo-52ab7",
    storageBucket: "prototipo-52ab7.appspot.com",
    messagingSenderId: "742503728153",
    appId: "1:742503728153:web:e22f5f1e3952b6bc295688",
    measurementId: "G-FE5VTRWKHG"
  };
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

firebase.messaging();