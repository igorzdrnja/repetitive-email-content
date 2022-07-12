import { GoogleLogout } from 'react-google-login';

function LogoutButton({
  showMessage,
  setIsLoggedIn,
  greetingTitle,
  setRepetitiveTextList,
  setIsProcessed
}) {
  const onLogoutSuccess = () => {
    setIsLoggedIn(false);
    setIsProcessed(false);
    setRepetitiveTextList({});
    showMessage(`${greetingTitle}, you're successfully logged out. Hope to see you again soon!`);
  }

  return (
      <div id='logoutButton'>
        <GoogleLogout clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
                      buttonText='Logout'
                      onLogoutSuccess={onLogoutSuccess}/>
      </div>
    );
}

export default LogoutButton;
