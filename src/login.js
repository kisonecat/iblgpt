import { checkKey } from "./chat.js";

export var apiKey = null;

function updateLogin() {
  if (apiKey === null) {
    document.getElementById("openai-form").style.display = 'block';
    document.getElementById("button-logout").disabled = true;
    document.getElementById("user-submit").disabled = true;
  } else {
    document.getElementById("openai-form").style.display = 'none';
    document.getElementById("button-logout").disabled = false;
    document.getElementById("user-submit").disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  document.getElementById("openai-error").style.display = 'none';
  document.getElementById("openai").addEventListener('input', async function () {
    document.getElementById("openai-submit").disabled = false;
    document.getElementById("openai-error").style.display = 'none';
  });
  
  document.getElementById("button-logout").addEventListener('click', function () {
    apiKey = null;
    document.getElementById("openai").value = '';
    localStorage.removeItem("openai");
    updateLogin();
  });
    
  document.getElementById("openai-submit").addEventListener('click', async function () {
    apiKey = document.getElementById("openai").value;
    if (await checkKey( apiKey )) {
      localStorage.setItem("openai", apiKey);
      updateLogin();
    } else {
      document.getElementById("openai-error").style.display = 'block';
      document.getElementById("openai-submit").disabled = true;
    }
  });

  apiKey = localStorage.getItem("openai");
  document.getElementById("openai").value = apiKey;
  updateLogin();
}, false);
