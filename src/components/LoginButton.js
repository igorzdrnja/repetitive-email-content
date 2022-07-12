import { GoogleLogin } from 'react-google-login';

function LoginButton({
    showMessage,
    setIsLoggedIn,
    setGreetingTitle,
    setUserID,
  }) {
  const onLoginSuccess = (res) => {
    setIsLoggedIn(true);
    const name = res.profileObj.givenName || res.profileObj.email;
    setUserID(res.profileObj.email);
    setGreetingTitle(name);
    showMessage(`Hello, ${name}!
    \nLet's find the repetitive email content that TextBlaze can automate for you :)`);
  }

  const onLoginFailure = () => {
    showMessage('Google Login error');
  }

  const onRequest = ()=> {
    showMessage('');
  }

  return (
    <div id='loginButton'>
      <GoogleLogin clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
                   buttonText='Analyze my emails'
                   onSuccess={onLoginSuccess}
                   onFailure={onLoginFailure}
                   onRequest={onRequest}
                   cookiePolicy={'single_host_origin'}
                   isSignedIn={true} />
    </div>
  )
}

export default LoginButton;
