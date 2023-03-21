import { } from "./styles/index.js";
import { checkKey, streamCompletion } from "./chat.js";
import { appendToTranscript, beginResponse, appendToResponse, finishResponse } from "./transcript.js";
import { apiKey } from "./login.js";

document.getElementById("MathJax-script").addEventListener('load', function () { });

////////////////////////////////////////////////////////////////

let systemContent = 'You are a patient and kind teacher in an inquiry-based learning class.  The topic is number theory.  Use TeX delimited by \\( and \\) like with dollar signs like \\(x\\).  Try to use mathematical notation in TeX or LaTeX whenever possible.  The goal is to show that \\(x \\equiv y \mod m\\) is an equivalence relation.  The user should discover this fact for themselves.  Do not give answers.  Ask questions to guide the student.  Ask leading questions.  Model an excellent inquiry-based learning environment. If the student strays away from a mathematical discussion, guide the student to return to a mathematical discussion and encourage the student to continue discussing mathematics.';

let initialMessage = 'Can you show that congruence is an equivalence relation?  If you are not sure how to begin or what this means, let me know and I can help.';

let messages = [ { role: "system", content: systemContent },
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
    messages: [{ role: "user", content: "Suppose a teacher and a student had the conversation provided below.  Would you say that the student has given a complete and rigorous proof that congruence is " + theorem + "? If the student's argument is complete and rigorous then respond YES. Otherwise, respond NO.\n\n" + conversation }]
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
