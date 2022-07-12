import { useState, useEffect } from 'react';
import { gapi } from 'gapi-script';
import './App.css';
import LoginButton from './components/LoginButton';
import LogoutButton from './components/LogoutButton';
import processMessage from './helpers/CountMinSketch';
import getGoogleMessageText from './helpers/Email';

const createCountMinSketch = require('count-min-sketch');

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [greetingTitle, setGreetingTitle] = useState('');
  const [userID, setUserID] = useState('');
  const [message, setMessage] = useState('');
  const [emailMessages, setEmailMessages] = useState([]);
  const [repetitiveTextList, setRepetitiveTextList] = useState({});
  const [isProcessed, setIsProcessed] = useState(false);

  const sketch = createCountMinSketch(0.000001, 0.001);

  useEffect(() => {
    // Load google api client on app start
    gapi.load('client:auth2', () => {
      gapi.client.init({
        clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        scope: process.env.REACT_APP_GOOGLE_API_SCOPE
      });
    })
  }, []);

  useEffect(() => {
    // Retrieve email list
    if (userID) {
      const now = new Date().toLocaleDateString('en-US')
      let then = new Date();
      then.setDate(then.getDate() - process.env.REACT_APP_NUMBER_OF_DAYS_TO_PROCESS)
      then = then.toLocaleDateString('en-US')

      gapi.client.request({
        path: `https://gmail.googleapis.com/gmail/v1/users/${userID}/messages?q=in:sent after:${then} before:${now}`
      }).then(res => {
        setEmailMessages(res.result.messages);
      });
    }
  }, [userID]);

  useEffect(() => {
    // Retrieve all the emails
    if (emailMessages.length && isLoggedIn) {
      let reqArray = [];
      for (let i = 0; i < emailMessages.length; i++) {
        reqArray.push(
          gapi.client.request({
            path: `https://gmail.googleapis.com/gmail/v1/users/${userID}/messages/${emailMessages[i].id}`
          })
        )
      }
      // Process each message to extract relevant sent text and feed the sketch with occurrences
      Promise.allSettled(reqArray).then((results) => {
        let phrasesWithCount = {};
        for (let i=0; i < results.length; i+=1) {
          if (results[i].value && results[i].value && results[i].value.result && results[i].value.result.payload) {
            const parsedMessage = getGoogleMessageText(results[i].value.result.payload);
            processMessage(parsedMessage, sketch, phrasesWithCount);
          }
        }
        // Remove substrings of found repetitive text from the final result
        const keys = Object.keys(phrasesWithCount).sort((a, b) => a.length - b.length);
        for (let i=0; i < keys.length - 1; i+=1) {
          keys.slice(keys.indexOf(keys[i]) + 1).find(element => {
            if (element.toLowerCase().includes(keys[i].toLowerCase())) {
              delete phrasesWithCount[keys[i]];
              return true;
            }
            return false;
          });
        }
        setRepetitiveTextList(phrasesWithCount);
        setIsProcessed(true);
      });
    }
    // eslint-disable-next-line
  }, [emailMessages, userID, isLoggedIn]);

  const showMessage = (message) => {
    setMessage(message);
  };

  const button = !isLoggedIn ? <LoginButton
        showMessage={showMessage}
        setIsLoggedIn={setIsLoggedIn}
        setUserID={setUserID}
        setGreetingTitle={setGreetingTitle}
      /> : <LogoutButton
        showMessage={showMessage}
        setIsLoggedIn={setIsLoggedIn}
        greetingTitle={greetingTitle}
        setIsProcessed={setIsProcessed}
        setRepetitiveTextList={setRepetitiveTextList}/>;
  return (
    <div className="App">
      <br/>
      { button }
      <br/>
      <div>{message}</div>
      {
        (isLoggedIn && isProcessed) ? <h2>You repetitively used the following phrases:</h2> : isLoggedIn ? <h2>Processing...</h2> : ''
      }

      {
        isLoggedIn ?
        <ul style={{ listStyleType: 'none' }}>
          {
            Object.entries(repetitiveTextList).map((entry, idx) => {
              return <li key={idx}>{entry[0]}</li>;
            })
          }
        </ul> : ''
      }
    </div>
  );
}

export default App;
