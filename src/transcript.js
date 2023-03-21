export function appendToTranscript( person, text ) {
  let container = document.getElementById('transcript');

  const dt = document.createElement("dt");
  const dtText = document.createTextNode(person);
  dt.appendChild(dtText);

  const dd = document.createElement("dd");
  const ddText = document.createTextNode(text);
  dd.appendChild(ddText);

  container.appendChild(dt);
  container.appendChild(dd);
  dd.classList.add(person);
  dt.classList.add(person);
  
  if ('MathJax' in window) {
    MathJax.typesetPromise([dd]).then(() => { });
  }
}

export function beginResponse(person) {
  let container = document.getElementById('transcript');

  const dt = document.createElement("dt");
  const dtText = document.createTextNode(person);
  dt.appendChild(dtText);

  const dd = document.createElement("dd");

  dd.classList.add(person);
  dt.classList.add(person);
  container.appendChild(dt);
  container.appendChild(dd);

  return dd;
}

export function appendToResponse(dd, text) {
  while (dd.firstChild) {
    dd.removeChild(dd.firstChild);
  }
  
  const ddText = document.createTextNode(text);
  dd.appendChild(ddText);

  window.scrollTo(0, document.body.scrollHeight);
}

export function finishResponse(dd) {
  if (MathJax !== undefined) {
    MathJax.typesetPromise([dd]).then(() => {});
  }
}
