## Google OAuth2 X

### Consent screen

Simply extend the `GoogleAuth` class and override the `openConsentScreen_()` method, which should return a `Promise<string redirectedUrl>`.

#### Consent screen for electron app

```js
const GoogleAuth = require('google-oauth2-x');
const {shell} = require('electron');

class ElectronGoogleAuth extends GoogleAuth {
	openConsentScreen_() {
		return new Promise(resolve => {
			let server = http.createServer((req, res) => {
				resolve(req.url);
				res.end('thanks');
				server.close();
			}).listen();
			let port = server.address().port;
			let endpoint = this.getConsentScreenEndpoint_(`http://localhost:${port}`);
			
			shell.openExternal(endpoint); // electron
		});
	}
}
```

#### Consent screen for node app

Replace `electron.shell` with `child_process.exec`:

```js
const GoogleAuth = require('google-oauth-2');
const {exec} = require('child_process');

class NodeGoogleAuth extends GoogleAuth {
	openConsentScreen_() {
		return new Promise(resolve => {
			let server = http.createServer((req, res) => {
				resolve(req.url);
				res.end('thanks');
				server.close();
			}).listen();
			let port = server.address().port;
			let endpoint = this.getConsentScreenEndpoint_(`http://localhost:${port}`);
			
			exec('start https://google.com') // windows
		});
	}
}
```

### API

#### `new GoogleAuth(string credentialsPath, string tokensPath, string scope)`

#### `Promise<string token> getToken()`

#### `Promise<string token> getRefreshedToken()`

### Example Usage

```js
let youtubeAuth = new GoogleAuth(
	'resources/credentials.json',
	'appWorkingDir/tokens.json',
	'https://www.googleapis.com/auth/youtube');

let main = async () => { 
    console.log(await youtubeAuth.getToken()); // xyz
    console.log(await youtubeAuth.getRefreshedToken()); // uvw
    console.log(await youtubeAuth.getToken()); // uvw
};
main();
```
