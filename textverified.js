const fetch = require("make-fetch-happen");

async function fetchTextVerifiedAuthToken(accessToken) {
  const config = {
    headers: {
      "X-SIMPLE-API-ACCESS-TOKEN": accessToken,
    },
    method: "POST",
  };
  const response = await fetch(
    "https://www.textverified.com/Api/SimpleAuthentication",
    config
  );

  if (!response.ok) {
    return null;
  }
  const authTokens = await response.json();
  return authTokens.bearer_token;
}

async function getUberVerificationId(authToken) {
  const token = "Bearer " + authToken;
  const config = {
    headers: {
      Authorization: token,
    },
    method: "GET",
  };

  const response = await fetch(
    "https://www.textverified.com/Api/Targets",
    config
  );

  if (!response.ok) {
    console.log("Failed to get verification targets. Site Down?");
    return null;
  }

  const verificationIds = await response.json();
  return verificationIds.find((obj) => obj.name == "UberEats").targetId;
}

async function getUberVerificationPayload(authToken, uberVerificationId) {
  const token = "Bearer " + authToken;
  const config = {
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      id: uberVerificationId,
    }),
  };

  const response = await fetch(
    "https://www.textverified.com/Api/Verifications",
    config
  );

  if (!response.ok) {
    switch (response.status) {
      case 503:
        console.log("No available numbers.");
        break;
      case 429:
        console.log("Too many verifications open.");
        break;
      case 402:
        console.log("Not enough credits.");
        break;
      default:
        console.log("Unknown error when creating verification.");
        console.log(response);
        break;
    }
    return null;
  }

  if (response == "Insufficient credits to start a verification.") {
    console.log(response);
    return null;
  }

  return await response.json();
}

async function reportVerification(vid, authToken) {
  const token = "Bearer " + authToken;
  const config = {
    headers: {
      Authorization: token,
    },
    method: "PUT",
  };

  const response = await fetch(
    "https://www.textverified.com/Api/Verifications/" + vid + "/Report",
    config
  );
  return response;
}

module.exports = {
  fetchTextVerifiedAuthToken,
  getUberVerificationId,
  getUberVerificationPayload,
  reportVerification,
};
