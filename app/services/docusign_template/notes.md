# Docusign

## Docusign requirements

The app uses a third-party SAAS called Docusign to send and allow prospects to sign contracts.
To use this api, you need to fill several variables in the env:

- DOCUSIGN_BASE_OAUTH_PATH - this is the oath server url. It's going to be different depending if it's sandbox or live.

- DOCUSIGN_BASE_PATH - this is the api base url. It's going to be different depending if we're using sandbox or live.

- DOCUSIGN_USER_ID - this is the user id for the sender. You can get this in docusign -> admin -> users -> detail.

- DOCUSIGN_ACCOUNT_ID - This is the account id. You can find this in docusign -> admin -> top left corner.

- DOCUSIGN_CLIENT_ID - This is the integration key. You can find it in docusign -> api and keys -> the name of the app/environment.

- DOCUSIGN_TEMPLATE_ID - This is the id for the template we are using it to build the contracts.
  Note: this will be deprecated when we introduce Products table.

- DOCUSIGN_KEY - This is the private key for the environment used. We have local, dev, qa & production.

Important note: DO NOT TRUST THE DEFAULT values. They may be outdated.

### How to create a new sandbox key

Follow these steps if you need to create a new key.
Go to docusign -> sandbox -> api and keys.

1. Press button to add new app.
2. Give it a name
3. Copy the integration key, that's your DOCUSIGN_CLIENT_ID
4. Choose Authorization Code Grant
5. Generate a private RSA Key. Place it in the source code.

Source:

- https://github.com/docusign/eg-01-node-jwt

### IMPORTANT STEP: We need to grant admin consent for internal applications.

This is very important because we need the api user to give consent to use the integration key.

How can we do this?

> In sandbox. You can use the DocuSign Admin panel to directly grant consent to applications owned by your organization (applications whose Integration Keys are owned by your org) on behalf of all of your users.
> To directly grant consent to an internal application:

- From the organization dashboard, click the Applications tile.
- Click Authorize Application and choose an application from the drop-down menu. This menu lists every integration key by name.
- In the Add New Application dialog, enter the permissions you are granting the users of your application. Typically this is signature impersonation.

> For production keys, we can give manual individual consent. We only need to do this once:

- The first thing we need is to set a redirect url. This can be anything. In this case I put https://api.app.nimblefi.com/v1/health
- Next we need to copy and paste a URL in the format below and sign in with the user we want to give consent.
- After this we sign in and give consent.

URL:
https://account.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=CLIENTID&redirect_uri=https%3A%2F%2Fapi.app.nimblefi.com%2Fv1%2Fhealth

Notes:

- the scope must be the same as the ones used by the jwt request.
- if you don't do this you will get a error_consent when authenticating.
- if you login to docusign -> user profile -> connected apps then you can see which apps the user gave authorization

Source:

- https://www.docusign.com/blog/dsdev-using-the-oauth-jwt-flow/
- https://developers.docusign.com/esign-rest-api/guides/authentication/obtaining-consent
- https://developers.docusign.com/esign-rest-api/guides/authentication/oauth2-jsonwebtoken
- https://github.com/docusign/docusign-java-client/issues/118

### How to promote a key from sandbox to live (Go Live Process)

The process is deeply explained in this video and document:

- https://developers.docusign.com/esign-rest-api/guides/go-live
- https://developers.docusign.com/esign-rest-api/guides/go-live-steps
- video: https://www.youtube.com/watch?v=QWzuXuxSm8Q

Some notes about this process:

- The Go Live Process for production keys can take from 3 days to 1 week.

Conditions it must obey:

- The app must not break polling rules.
- The app must not cause api errors
- Must be a paid account
- You need 20 successfull api calls made on a key

The outcome will be a COPY OF THE SAME integration key (also known as a client id) in the production environment. One will work in live, and the other in dev.

What is the difference ?

Even though both keys will be the same, they will use DIFFERENT servers for the oath and api url's.
Example servers for production:

- DOCUSIGN_BASE_OAUTH_PATH = https://account.docusign.com
- DOCUSIGN_BASE_PATH = https://{server}.docusign.net/...

Also, the Private Key pair will be different as well.

### Multiple Composite Templates

We are creating Envelopes on the fly with multiple composite templates.
Here is Documentation on the business decisions:
- https://lassos.atlassian.net/jira/software/projects/NIM/boards/15?selectedIssue=NIM-486
- https://docs.google.com/spreadsheets/d/167Fa3O-T8moRdSCwPxARoA0LfrCejPPDvXtcpoLmpKA/edit#gid=0
- https://drive.google.com/drive/folders/1PN6mglCmLfQnPwxbB28jCGFQSnfR75_h

Product Data inserted in dev and production:
- https://lassos.atlassian.net/wiki/spaces/LAS/pages/749568001/Product+data

References:
- https://support.docusign.com/en/articles/How-to-use-multiple-templates
- https://www.docusign.com/blog/dsdev-why-use-composite-templates
- https://github.com/docusign/code-examples-node/blob/master/lib/eSignature/eg017SetTemplateTabValues.js
- https://github.com/docusign/docusign-node-client/blob/9f5e3c6e3ea76e03b9d22b90fe1d1eab6d46ab1a/test/SdkUnitTestsWithCallback.js


### How to embed a signature

After we create a envelope, we need to take the envelopeId and call new docusign.RecipientViewRequest()

It will return a url like this: https://demo.docusign.net/Signing/MTRedeem/v1/fe36d81e-1e10-48b9-ac55-d6962c2c02f6?slt=eyJ0eXAiOiJNVCIsImFsZyI6IlJTMjU2Iiwia2lkI

The url has a short time to live and can be opened only once.
A recipient can sign the document and when he closes the docusign window we will get a callback reporting the state of the signature (see below).


When the clientUserId property is present and its value is not null no email is sent to the recipient (only the envelope complete email gets sent once signing is done, but that is configurable). Basically the only thing you have to remember with embedding is that you set the clientUserId property for your recipients at the time they are added to the envelope, then when you are request a URL token you need to reference the same email, name, and clientUserId combination.

Example:

```
    return docusign.Signer.constructFromObject({
      email: signer.email,
      name: this._fullName(signer),
      roleName: this.docusignRoles[`signer${position}`],
      recipientId: position,
      clientUserId: "coco"+position.toString()
    })
```

Docs:
- https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopeviews/createrecipient/

Try it:
- https://apiexplorer.docusign.com/#/esign/restapi?categories=Envelopes&tags=EnvelopeViews&operations=createRecipient

### What is the return URL ?

The URL to which the user should be redirected after the signing session has ended.
DocuSign redirects to the URL and includes an event query parameter that can be used by your application.

So we can use this URL and the parameters to know if a user finished signing a document or not.

#### IMPORTANT: We can only send the document to signer2 after signer1 finishes and so on.

Possible event parameter values include:

- access_code_failed: Recipient used incorrect access code.
- cancel: Recipient canceled the signing operation, possibly by using the Finish Later option.
- decline: Recipient declined to sign.
- exception: A system error occurred during the signing process.
- fax_pending: Recipient has a fax pending.
- id_check_failed: Recipient failed an ID check.
- session_timeout: The session timed out. An account can control this timeout by using the igner Session Timeout option.
- signing_complete: The recipient completed the signing ceremony.
- ttl_expired: The Time To Live token for the envelope has expired. After being successfully invoked, these tokens expire after 5 minutes or if the envelope is voided.
- viewing_complete: The recipient completed viewing an envelope that is in a read-only/terminal state, such as completed, declined, or voided.
