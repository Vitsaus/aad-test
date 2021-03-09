const msal = require('@azure/msal-node');
const Hapi = require('@hapi/hapi');

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

const init = async () => {

    const server = Hapi.server({
        port: SERVER_PORT,
        host: 'localhost'
    });


    const pca = new msal.ConfidentialClientApplication({
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
    });

    server.route({
        method: 'GET',
        path: '/',
        handler: async (request, h) => {
            try {
                const response = await pca.getAuthCodeUrl({
                    scopes: SCOPES,
                    loginHint: PREFERRED_USERNAME,
                    redirectUri: REDIRECT_URI,
                    prompt: 'login',
                });
                console.log('got auth code redirect url response', response);
                return h.redirect(response);
            } catch (e) {
                return h.response({
                    error: 'something failed!',
                });
            }

        }
    });

    server.route({
        method: 'GET',
        path: '/redirect',
        handler: async (request, h) => {

            try {

                const response = await pca.acquireTokenByCode({
                    code: request.query.code,
                    scopes: SCOPES,
                    redirectUri: REDIRECT_URI,
                });

                return h.response({
                    accountObjectId: response.account.localAccountId,
                    email: response.account.username
                });

            } catch (e) {
                console.log(e);
                return h.response({
                    error: "something went wrong!"
                });
            }

        }
    });

    await server.start();

    console.log('Server running on %s', server.info.uri);

};

process.on('unhandledRejection', (err) => {
    console.log('unhandled error', err);
    process.exit(1);
});

init();
