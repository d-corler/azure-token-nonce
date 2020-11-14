import type { Request } from "express";
import { promisify } from "util";
import jwksClient from "jwks-rsa";
import base64url from "base64url";
import { SHA_256 } from "sha2";
import { verify, VerifyOptions } from "jsonwebtoken";

export interface Options {
  tenantId: string;
  clientId: string;
  kid: string;
  issuer?: string;
  jsonwebtoken?: VerifyOptions;
  jwksClient?: jwksClient.ClientOptions;
}

/**
 * Verify token provided by AzureAD with V2 endpoint (compatible with nonce property)
 */
export class AzureTokenNonce {
  private static _options: Options | undefined;
  private static _jwksClient: jwksClient.JwksClient | undefined;

  /**
   * Configure library (required before any operation)
   */
  static configure(options: Options) {
    // Save options
    AzureTokenNonce._options = options;

    // Configure jwks client
    AzureTokenNonce.createJwsClient();
  }

  /**
   * Create Jws client
   */
  private static createJwsClient() {
    const jwksUri = `https://login.microsoftonline.com/${
      AzureTokenNonce._options!.tenantId
    }/discovery/v2.0/keys`;

    AzureTokenNonce._jwksClient = jwksClient(
      AzureTokenNonce._options!.jwksClient ?? {
        strictSsl: true,
        jwksUri,
        cache: true,
      }
    );
  }

  /**
   * Extract token from headers
   */
  private static extractTokenFromHeader(req: Request) {
    const authorizationHeader = req.header("Authorization");
    if (authorizationHeader && authorizationHeader.split(" ")[0] === "Bearer") {
      return authorizationHeader.split(" ")[1];
    } else {
      return authorizationHeader;
    }
  }

  /**
   * Verify token
   */
  public static async verifyToken(req: Request) {
    // Check if library is configured
    if (!AzureTokenNonce._options)
      throw new Error('Please call "configure" method before');

    // Extract token from headers
    const token = AzureTokenNonce.extractTokenFromHeader(req);
    // Check if token exist
    if (!token) throw new Error("Missing token");
    // Retrieve RSA signing keys
    const signingKey = await promisify(
      AzureTokenNonce._jwksClient!.getSigningKey
    )(AzureTokenNonce._options.kid!);
    // Replace "nonce"
    const [header_raw, body_raw, sig] = token.split(".");
    // Check token integrity
    if (!header_raw || !body_raw || !sig) throw new Error("Invalid token");
    // Decode header
    const header_decoded = JSON.parse(base64url.decode(header_raw));
    // Replace "nonce" property
    header_decoded.nonce = base64url.encode(SHA_256(header_decoded.nonce));
    // Encode header
    const header_encoded = base64url.encode(JSON.stringify(header_decoded));
    // Generate new token
    const new_token = `${header_encoded}.${body_raw}.${sig}`;
    // Verify token
    const decoded = verify(
      new_token,
      signingKey.getPublicKey(),
      Object.assign(
        {
          issuer:
            AzureTokenNonce._options.issuer ??
            `https://sts.windows.net/${AzureTokenNonce._options.tenantId}/`,
        },
        AzureTokenNonce._options.jsonwebtoken
      )
    ) as Record<string, unknown>;
    // Verify app identifier
    if (decoded.appid !== AzureTokenNonce._options.clientId) {
      throw new Error(
        `Wrong application identifier (expected "${AzureTokenNonce._options.clientId}" instead of ${decoded.appid}")`
      );
    }

    return decoded;
  }
}
