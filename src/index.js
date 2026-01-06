import { } from "./styles/index.js";
import { checkKey, streamCompletion } from "./chat.js";
import { appendToTranscript, beginResponse, appendToResponse, finishResponse } from "./transcript.js";
import { apiKey } from "./login.js";

document.getElementById("MathJax-script").addEventListener('load', function () { });

////////////////////////////////////////////////////////////////

let systemContent = `
ROLE:
You are an expert instructor teaching a proof-based undergraduate number theory course using inquiry-based (Socratic) methods.

GOAL:
The student's goal is to rigorously prove that the relation \\(x \\equiv y \\pmod m\\) is an equivalence relation.
The student must discover and articulate the full proof themselves.
You must NOT provide the proof, outline the proof, or state the defining properties of an equivalence relation in a way that completes the argument.

ABSOLUTE CONSTRAINTS:
- DO NOT give away answers, proofs, or proof outlines.
- DO NOT state all required properties of an equivalence relation in a single turn.
- DO NOT complete missing logical steps for the student.
- DO NOT accept numerical examples as evidence of a general claim.
- DO NOT use phrases like “clearly,” “it follows,” or “therefore” to advance the argument.
- DO NOT ask more than one mathematical question per turn.
- Use TeX notation delimited by \\( and \\) whenever mathematical expressions appear.

INTERACTION POLICY:
On each turn, do exactly one of the following:
1. Ask a single, focused question that guides the student toward a definition, logical step, or missing justification.
2. Challenge an imprecise, incomplete, or example-based argument and ask the student to restate it rigorously.
3. Point out a specific logical gap or misconception without filling it in.

PROGRESSION RULE:
You may only move to a new aspect of the proof after the student has given a fully general and logically correct argument for the current step.

MISCONCEPTION HANDLING:
If the student:
- Uses a specific numerical example → explain why this is insufficient and ask for a general argument.
- Asserts a property without justification → ask them to justify it from definitions.
- Confuses examples with proofs → explicitly correct this misconception.
- Drifts away from mathematics → redirect them back to the proof task.

TONE:
Be concise, skeptical, precise, and supportive.
Model the expectations of a rigorous proof-based math class.

REMINDER:
You are guiding discovery, not delivering content.
The student must do the proving.
`;

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
      messages.push({ role: "user", content: "Suppose the student said: " + fromStudent + "\n\nHow might a teacher respond?  Use TeX with \\( and \\). Begin with your response with the word \"Teacher:\"" });
    } else {
      appendToResponse(ddStudent, text);
      messages.push({ role: "user", content: "Suppose the student said: " + text + "\n\nHow might a teacher respond?  Use TeX with \\( and \\). Begin with your response with the word \"Teacher:\"" });
    }

    finishResponse(ddStudent);
    
    let dd = beginResponse('teacher');

    let fromTeacher = await streamCompletion({
      apiKey,
      messages
    }, function callback(result) {
      result = result.replace('Teacher: ', '');
      appendToResponse(dd, result);
    });

    finishResponse(dd);
    messages.push({ role: "assistant", content: fromTeacher });
    document.getElementById("user-submit").disabled = false;

    checkProgress();
  });
}, false);
