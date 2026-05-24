const normalizePhoneNumber = (rawPhone = "") => {
  const digitsOnly = String(rawPhone || "").replace(/\D/g, "");

  if (!digitsOnly) {
    return "";
  }

  if (String(rawPhone).trim().startsWith("+")) {
    return String(rawPhone).trim();
  }

  if (digitsOnly.startsWith("91") && digitsOnly.length === 12) {
    return `+${digitsOnly}`;
  }

  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }

  if (digitsOnly.startsWith("0") && digitsOnly.length === 11) {
    return `+91${digitsOnly.slice(1)}`;
  }

  return `+${digitsOnly}`;
};

const assertVoiceCallEnv = () => {
  const missing = [
    "VAPI_API_KEY",
    "VAPI_ASSISTANT_ID",
    "VAPI_PHONE_NUMBER_ID"
  ].filter((key) => !process.env[key]);

  if (missing.length) {
    const error = new Error(`Missing call configuration: ${missing.join(", ")}`);
    error.statusCode = 503;
    throw error;
  }
};

const buildReminderMessage = ({ tenantName, flatNumber, amount }) => {
  const safeName = tenantName || "Tenant";
  const safeFlat = flatNumber || "your flat";
  const safeAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;

  return [
    `Hello ${safeName}.`,
    "This is an automated rent reminder from Punnam Rent Manager.",
    `Your rent for flat ${safeFlat} is still pending.`,
    `Pending amount is ${safeAmount} rupees.`,
    "Please make the payment at the earliest. Thank you."
  ].join(" ");
};

const escapeXml = (value = "") => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const placeReminderCall = async ({ toPhone, tenantName, flatNumber, amount, variables = {} }) => {
  assertVoiceCallEnv();

  // Lazy load so the backend can boot even if the SDK is absent in a dev shell.
  // eslint-disable-next-line global-require
  const { VapiClient } = require("@vapi-ai/server-sdk");
  const client = new VapiClient({ token: process.env.VAPI_API_KEY });

  const normalizedTo = normalizePhoneNumber(toPhone);
  if (!normalizedTo) {
    const error = new Error("Tenant phone number is missing or invalid.");
    error.statusCode = 400;
    throw error;
  }

  const message = buildReminderMessage({ tenantName, flatNumber, amount });

  // Merge built message and common fields into variables so assistant can use them
  const callVariables = Object.assign(
    {
      FLAT_NUMBER: String(flatNumber || ""),
      AMOUNT_DUE: String(amount || 0),
      AMOUNT_PAID: String(0),
      REMINDER_MESSAGE: message
    },
    variables
  );

  return client.calls.create({
    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
    assistantId: process.env.VAPI_ASSISTANT_ID,
    customer: {
      number: normalizedTo,
      name: tenantName || "Tenant"
    },
    metadata: {
      flatNumber: String(flatNumber || ""),
      amount: String(amount || 0)
    },
    assistantOverrides: {
      variableValues: callVariables
    }
  });
};

module.exports = {
  placeReminderCall
};