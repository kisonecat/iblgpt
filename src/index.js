import { } from "./styles/index.js";
import { checkKey, streamCompletion } from "./chat.js";
import { appendToTranscript, beginResponse, appendToResponse, finishResponse } from "./transcript.js";
import { apiKey } from "./login.js";

document.getElementById("MathJax-script").addEventListener('load', function () { });

////////////////////////////////////////////////////////////////

let systemContent = 'You are teaching a proof-based math class. The topic is number theory. Use TeX delimited by \\( and \\) like \\(x\\). Use mathematical notation in TeX or LaTeX when possible. The user\'s goal is to rigorously show that \\(x \\equiv y \\mod m\\) is an equivalence relation. The user will discover this fact for themself. You will ask questions to guide the user to write down a complete rigorous proof. Model an excellent inquiry-based learning environment. Do not let the user simply give specific numerical examples. If the user strays from a mathematical discussion, you will guide the user to return to a mathematical discussion and encourage me to continue discussing mathematics. Specific numerical examples are not enough for a proof. I must give general, complete, rigorous proofs for each of my claims. You expect precise arguments.\n\nAddress common misconceptions, like the misconception that a single example suffices for a rigorous proof.';

let initialMessage = 'Can you show that congruence is an equivalence relation?  If you are not sure how to begin or what this means, let me know and I can help.';

let messages = [ { role: "user", content: systemContent },
                 { role: "assistant", content: initialMessage }];

async function checkIfProved(theorem) {
  let conversation = '';

  for (const message of messages) {
    if (message.role === "assistant") {
      conversation = conversation + "\n\nTeacher: " + message.content;
    }
    if (message.role === "user") {
      conversation = conversation + "\n\nStudent: " + message.content;
    }
  }
 
  let result = await streamCompletion({
    apiKey,
    messages: [{ role: "user", content: "Suppose a teacher and a student had the conversation provided below.  Would you say that the student has given a complete and rigorous proof that congruence is " + theorem + "? Explain the student's rigorous proof and provide feedback. If the student's argument is a complete and rigorous proof then respond YES. Otherwise respond NO.\n\n" + conversation }]
  }, function callback() {});

  console.log(theorem, result);
  
  if (result.match(/YES/)) return true;

  return false;
}

let provedReflexive = false;
let provedSymmetric = false;
let provedTransitive = false;

async function checkProgress() {
  if (provedReflexive === false) {
    provedReflexive = await checkIfProved("reflexive");
    if (provedReflexive) document.getElementById("task-refl").classList.add("done");
  }
  if (provedSymmetric === false) {
    provedSymmetric = await checkIfProved("symmetric");
    if (provedSymmetric) document.getElementById("task-sym").classList.add("done");
  }
  if (provedTransitive === false) {
    provedTransitive = await checkIfProved("transitive");
    if (provedTransitive) document.getElementById("task-trans").classList.add("done");
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  appendToTranscript("teacher",initialMessage);
  
  // Pushing return is the same as clicking the send button
  document.getElementById("user")
    .addEventListener("keyup", function (event) {
      event.preventDefault();
      if (event.key === 'Enter') {
        document.getElementById("user-submit").click();
      }
    });  
  
  document.getElementById("user-submit").addEventListener('click', async function () {
    let text = document.getElementById("user").value;
    document.getElementById("user").value = '';
    document.getElementById("user-submit").disabled = true;
    
    let ddStudent = beginResponse('student');

    if (text.length > 10) {
      let fromStudent = await streamCompletion({
        apiKey,
        messages: [{ role: "system", content: "You are an assistant to convert math to TeX and LaTeX where appropriate.  Do not change any other text.  Repeat non-mathematical text verbatim." },
                   {role: "user", content: "Repeat the text below. Do not add extra words. Do not change the text significantly. If the text doesn't make sense repeat it verbatim. Use the same words as provided, but rewrite the mathematics to use mathematical notation where appropriate, wrapping TeX and LaTeX mathematics in \\( and \\) as needed:\n\n" + text }]
      }, function callback(result) {
        appendToResponse(ddStudent, result);
      });
      messages.push({ role: "user", content: fromStudent });
    } else {
      appendToResponse(ddStudent, text);
      messages.push({ role: "user", content: text });
    }

    finishResponse(ddStudent);
    
    let dd = beginResponse('teacher');

    let fromTeacher = await streamCompletion({
      apiKey,
      messages
    }, function callback(result) {
      appendToResponse(dd, result);
    });

    finishResponse(dd);
    messages.push({ role: "assistant", content: fromTeacher });
    document.getElementById("user-submit").disabled = false;

    checkProgress();
  });
}, false);
