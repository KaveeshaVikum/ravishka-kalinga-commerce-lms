import axios from "axios";
import {
  decodeProtectedHeader,
  importX509,
  jwtVerify,
  type JWTPayload,
} from "jose";

const FIREBASE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const CLOCK_SKEW_SECONDS = 30;

type CertificateResponse = Record<string, string>;
type FirebasePayload = JWTPayload & {
  auth_time?: number;
  email?: string;
  firebase?: { sign_in_provider?: string };
  name?: string;
  phone_number?: string;
};

export type FirebaseIdentity = {
  uid: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  provider?: string;
};

let cachedCertificates: CertificateResponse | null = null;
let certificatesExpireAt = 0;
let certificateRequest: Promise<CertificateResponse> | null = null;

async function getCertificates(forceRefresh = false) {
  if (
    !forceRefresh &&
    cachedCertificates &&
    Date.now() < certificatesExpireAt
  ) {
    return cachedCertificates;
  }
  if (!forceRefresh && certificateRequest) return certificateRequest;

  certificateRequest = axios
    .get<CertificateResponse>(FIREBASE_CERTS_URL, { timeout: 5_000 })
    .then(response => {
      cachedCertificates = response.data;
      const maxAge = response.headers["cache-control"]?.match(/max-age=(\d+)/i);
      const maxAgeSeconds = maxAge ? Number(maxAge[1]) : 300;
      certificatesExpireAt = Date.now() + Math.max(0, maxAgeSeconds) * 1000;
      return response.data;
    })
    .finally(() => {
      certificateRequest = null;
    });

  return certificateRequest;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export async function verifyFirebaseIdToken(
  token: string,
  projectId: string
): Promise<FirebaseIdentity> {
  if (!projectId) throw new Error("Firebase project ID is not configured");

  const header = decodeProtectedHeader(token);
  if (header.alg !== "RS256" || !isNonEmptyString(header.kid)) {
    throw new Error("Unsupported Firebase ID token signing header");
  }

  let certificate = (await getCertificates())[header.kid];
  if (!certificate) {
    certificate = (await getCertificates(true))[header.kid];
  }
  if (!certificate)
    throw new Error("Firebase signing certificate was not found");

  const publicKey = await importX509(certificate, "RS256");
  const { payload } = await jwtVerify(token, publicKey, {
    algorithms: ["RS256"],
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`,
    clockTolerance: CLOCK_SKEW_SECONDS,
  });

  const claims = payload as FirebasePayload;
  const now = Math.floor(Date.now() / 1000);
  if (
    !isNonEmptyString(claims.sub) ||
    claims.sub.length > 128 ||
    claims.aud !== projectId ||
    typeof claims.iat !== "number" ||
    claims.iat > now + CLOCK_SKEW_SECONDS ||
    typeof claims.auth_time !== "number" ||
    claims.auth_time > now + CLOCK_SKEW_SECONDS
  ) {
    throw new Error("Firebase ID token is missing valid identity claims");
  }

  return {
    uid: claims.sub,
    ...(isNonEmptyString(claims.name) ? { name: claims.name } : {}),
    ...(isNonEmptyString(claims.email) ? { email: claims.email } : {}),
    ...(isNonEmptyString(claims.phone_number)
      ? { phoneNumber: claims.phone_number }
      : {}),
    ...(isNonEmptyString(claims.firebase?.sign_in_provider)
      ? { provider: claims.firebase.sign_in_provider }
      : {}),
  };
}
