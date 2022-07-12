import { decode } from 'js-base64';

const getGoogleMessageText = (message) => {
  let text = '';

  const fromEmail = getGoogleMessageEmailFromHeader('From', message);
  const toEmail = getGoogleMessageEmailFromHeader('To', message);

  let part;
  if (message.parts) {
    part = message.parts.find((part) => part.mimeType === 'text/plain');
  }

  let encodedText;
  if (message.parts && part && part.body.data) {
    encodedText = part.body.data;
  } else if (message.body.data) {
    encodedText = message.body.data;
  }

  if (encodedText) {
    text = decode(encodedText);
  }

  // NOTE: We need to remove history of email.
  // History starts with line (example): 'On Thu, Apr 30, 2020 at 8:29 PM John Doe <john.doe@example.com> wrote:'
  //
  // We also don't know who wrote the last message in history, so we use the email that
  // we meet first: 'fromEmail' and 'toEmail'
  const fromEmailWithRightArrow = `${fromEmail}>`;
  const toEmailWithRightArrow = `${toEmail}>`;
  // NOTE: Check if email has history
  const isEmailWithHistory = (!!fromEmail && text.indexOf(fromEmailWithRightArrow) > -1)
    || (!!toEmail && text.indexOf(toEmailWithRightArrow) > -1);

  if (isEmailWithHistory) {
    // NOTE: First history email with arrow
    const historyEmailWithRightArrow = findFirstSubstring(fromEmailWithRightArrow, toEmailWithRightArrow, text);
    text = removeHistory(text, historyEmailWithRightArrow)
  } else {
    // Special case of 'noreply' emails that have different header
    const hasNoReply = text.indexOf('noreply@');
    if (hasNoReply > -1) {
      text = removeHistory(text, 'noreply@');
    }
  }

  // Remove the potential signature at the end of email
  const signatureBeginningIndex = text.indexOf('\r\n\r\n-- \r\n\r\n');
  if (signatureBeginningIndex > -1) {
    text = text.substring(0, signatureBeginningIndex);
  }

  // Replace new lines and some of the special characters with space
  text = text.replace(new RegExp(/[\r\n]+/, 'g'), ' ');
  text = text.replace(/  +/g, ' ');
  text = text.trim()

  return text;
}

// Remove all the correspondence history that email message might contain, below the actual sent text
function removeHistory(emailText, lastSenderEmail) {
  // Remove previous newline if the first line of history took two rows
  emailText = emailText.replace(`<\r\n${lastSenderEmail}`, `<${lastSenderEmail}`)

  const lastSenderEmailIdx = emailText.indexOf(lastSenderEmail);

  // NOTE: Remove everything after `${fromEmail}>`
  emailText = emailText.substring(0, lastSenderEmailIdx + lastSenderEmail.length);
  // NOTE: Remove line that contains `${fromEmail}>`
  const fromRegExp = new RegExp(`^.*${lastSenderEmail}.*$`, 'mg');
  emailText = emailText.replace(fromRegExp, '');
  return emailText;
}


function getGoogleMessageEmailFromHeader(headerName, message) {
  const header = message.headers.find((header) => header.name === headerName);

  if (!header) {
    return null;
  }

  const headerValue = header.value; // John Doe <john.doe@example.com> , or only john.doe@example.com

  if (headerValue.lastIndexOf('<') === -1) return headerValue; // john.doe@example.com

  return headerValue.substring(
    headerValue.lastIndexOf('<') + 1,
    headerValue.lastIndexOf('>')
  );
}


function findFirstSubstring(a, b, str) {
  if (str.indexOf(a) === -1) return b;
  if (str.indexOf(b) === -1) return a;

  return (str.indexOf(a) < str.indexOf(b))
    ? a
    : b; // NOTE: (str.indexOf(b) < str.indexOf(a))
}

export default getGoogleMessageText;
