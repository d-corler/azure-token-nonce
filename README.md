# Azure token nonce

[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://spdx.org/licenses/MIT.html)

> Verify token provided by AzureAD with V2 endpoint (compatible with nonce property)

## Installation

With NPM :
```sh
npm install azure-token-nonce
```

With Yarn :
```sh
yarn azure-token-nonce
```

## Usage

### Configuration

```ts
import { AzureTokenNonce } from 'azure-token-nonce';

AzureTokenNonce.configure({
    tenantId: 'xxx',
    clientId: 'xxx',
    kid: 'xxx',
});
```

| Property       | Type                         | Required | Description                                                         |
| -------------- | ---------------------------- | -------- | ------------------------------------------------------------------- |
| `tenantId`     | `string`                     | `true`   | Unique identifier of your tenant                                    |
| `clientId`     | `string`                     | `true`   | Unique identifier of your client                                    |
| `kid`          | `string`                     | `true`   | Unique identifier of signing key (decode your token to retrieve it) |
| `issuer`       | `string`                     | `false`  | Overwrite issuer (default : https://sts.windows.net/<TENANT_ID>/)   |
| `jsonwebtoken` | `jsonwebtoken.VerifyOptions` | `false`  | Additional properties for "jsonwebtoken" library                    |
| `jwksClient`   | `jwksClient.ClientOptions`   | `false`  | Overwrite configuration of jwks client                              |

### Verify

```ts
// Express request as argument
await AzureTokenNonce.verifyToken(req);
```

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

## 📝 License

This project is under [MIT](https://spdx.org/licenses/MIT.html), feel free to fork.
