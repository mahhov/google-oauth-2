const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

class GoogleAuth {
	/*
		Certificate:
		{
			"installed": {
				"client_id": "abc",
				"project_id": "my-project-123",
				"auth_uri": "https://accounts.google.com/o/oauth2/auth",
				"token_uri": "https://oauth2.googleapis.com/token",
				"auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
				"client_secret": "xyz",
				"redirect_uris": [
					"urn:ietf:wg:oauth:2.0:oob",
					"http://localhost"
				]
			}
		}
		Tokens response:
		{
			access_token: 'xyz',
			expires_in: 3600,
			refresh_token: 'abc',
			scope: 'https://www.googleapis.com/auth/youtube',
			token_type: 'Bearer'
		}
	*/
	constructor(credentialsPath, tokensPath, scope) {
		this.credentials_ = GoogleAuth.readJson_(credentialsPath, true).installed;
		this.tokens_ = GoogleAuth.readJson_(tokensPath);
		this.tokensPath_ = tokensPath;
		this.scope_ = scope;
	}

	static readJson_(jsonPath, reportErrors) {
		try {
			return JSON.parse(fs.readFileSync(path.resolve(jsonPath), 'utf-8'));
		} catch (e) {
			if (reportErrors)
				throw e;
		}
	}

	openConsentScreen_() {
		/* override */
		// return Promise<string redirectUrl>
	}

	getConsentScreenEndpoint_(redirectUri) {
		this.redirectUri_ = redirectUri;
		return `${this.credentials_.auth_uri}?client_id=${this.credentials_.client_id}&redirect_uri=${redirectUri}&response_type=code&scope=${this.scope_}`;
	}

	getToken() {
		if (this.token_)
			;
		else if (this.tokens_)
			this.token_ = this.refreshToken_(this.tokens_.refresh_token);
		else
			this.token_ = this.cleanToken_();
		this.token_.then(() => this.token_.resolved = true);
		return this.token_;
	}

	getRefreshedToken(force = false) {
		if (force || this.token_?.resolved)
			this.token_ = null;
		return this.getToken();
	}

	getCleanToken(force = false) {
		if (force || this.token_?.resolved) {
			this.token_ = null;
			this.tokens_ = null;
		}
		return this.getToken();
	}

	async refreshToken_(refreshToken) {
		return new Promise(resolve =>
			https.request(this.credentials_.token_uri, {method: 'POST'}, res =>
				res.on('data', data => resolve(JSON.parse(data.toString()).access_token))
			).end(JSON.stringify({
				refresh_token: refreshToken,
				client_id: this.credentials_.client_id,
				client_secret: this.credentials_.client_secret,
				grant_type: 'refresh_token',
			})));
	}

	async cleanToken_() {
		let code = await this.requestCode_();
		this.tokens_ = await this.requestToken_(code);
		fs.writeFile(this.tokensPath_, JSON.stringify(this.tokens_, null, 2),
			err => {
				if (err)
					throw err;
			});
		return this.tokens_.access_token;
	}

	async requestCode_() {
		let redirectUrl = await this.openConsentScreen_();
		return url.parse(redirectUrl, true).query.code;
	}

	async requestToken_(code) {
		return new Promise(resolve =>
			https.request(this.credentials_.token_uri, {method: 'POST'}, res =>
				res.on('data', data => resolve(JSON.parse(data.toString())))
			).end(JSON.stringify({
				code: code,
				client_id: this.credentials_.client_id,
				client_secret: this.credentials_.client_secret,
				redirect_uri: this.redirectUri_,
				grant_type: 'authorization_code',
			})));
	}
}

module.exports = GoogleAuth;
