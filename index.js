const express = require("express");
const msal = require('@azure/msal-node');

// Azure tenant id
const AUTHORITY = "https://login.microsoftonline.com/f4f0b5bf-f3b5-44c9-af62-63ad9dc56371";

// Application id
const CLIENT_ID = "324ffd61-fb09-4d98-b01f-dfc75bf88c99";

// Application secret value, possibly cert in our case?
const CLIENT_SECRET = "Nz-I5cVyt252iXJr-_ZLL4F-Exe8B1VsOm";

const PREFERRED_USERNAME = "ville.i.takala@gmail.com";

const REDIRECT_URI = "http://localhost:3000/redirect";

const SCOPES = ['user.read'];

const SERVER_PORT = process.env.PORT || 3000;

const config = {
    auth: {
        clientId: CLIENT_ID,
        authority: AUTHORITY,
        clientSecret: CLIENT_SECRET
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
};

const pca = new msal.ConfidentialClientApplication(config);

const app = express();

app.get('/', (req, res) => {
    const authCodeUrlParameters = {
        scopes: SCOPES,
        loginHint: PREFERRED_USERNAME,
        redirectUri: REDIRECT_URI,
    };

    pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
        console.log('got auth code redirect url response', response);
        res.redirect(response);
    }).catch((error) => console.log(JSON.stringify(error)));
});

app.get('/redirect', (req, res) => {
    const tokenRequest = {
        code: req.query.code,
        scopes: SCOPES,
        redirectUri: REDIRECT_URI,
    };

    pca.acquireTokenByCode(tokenRequest).then((response) => {
        console.log("\nResponse: \n:", response);
        res.json({
            accountObjectId: response.account.localAccountId,
            email: response.account.username
        });
    }).catch((error) => {
        console.log(error);
        res.status(500).send({
            error: "something went wrong!"
        });
    });
});


app.listen(SERVER_PORT, () => console.log(`Server listening at ${SERVER_PORT}!`))
