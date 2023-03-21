import { fetchEventSource } from '@microsoft/fetch-event-source';

export function streamCompletion(parameters, callback) {
  return new Promise((resolve, reject) => {
    let result = '';
    
    fetchEventSource("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + parameters.apiKey,
      },
      body: JSON.stringify({
        "model": "gpt-3.5-turbo",
        //"messages": [{ "role": "user", "content": "Say this is a test!" }],
        messages: parameters.messages,
        "temperature": 0.0,
        "stream": true
      }),
      onmessage(ev) {
        if (ev.data != '[DONE]') {
          let payload = JSON.parse(ev.data).choices[0];

          if (payload.delta && payload.delta.content) {
            result = result + payload.delta.content;
            callback(result);
          } else if (payload.finish_reason) {
            resolve(result);
          }
        }
      },
      onerror(err) {
        if (err instanceof FatalError) {
          reject(err);
          throw err; // rethrow to stop the operation
        } else {
          // do nothing to automatically retry. You can also
          // return a specific retry interval here.
        }
      }
    });
  });
}

export async function checkKey( key ) {
  let response = await fetch("https://api.openai.com/v1/models", {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + key,
    }
  });

  return (response.status === 200);
}
