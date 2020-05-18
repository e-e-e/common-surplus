const fetch = require('node-fetch');
// const uuid = require('uuid');

const baseUrl = process.env.TW_BASE_URL;
const apiToken = process.env.TW_API_TOKEN;

function getProfiles() {
  return fetch(`${baseUrl}/v1/profiles`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiToken}`
    },
  }).then(res => res.json());
}

function getQuote(id, payout) {
  return fetch(`${baseUrl}/v1/quotes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      profile: id,
      source: "AUD",
      target: "AUD",
      rateType: "FIXED",
      sourceAmount: payout,
      type: "BALANCE_PAYOUT",
    })
  }).then(res => res.json());
}

function createAccount(id, details) {
  return fetch(`${baseUrl}/v1/accounts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      profile: id,
      accountHolderName: details.name,
      currency: "AUD",
      type: "australian",
      details: {
        legalType: "PRIVATE",
        bsbCode: details.bsb, //"023604",
        accountNumber: details.accountNumber, //"123456789"
      }
    })
  }).then(res => res.json());
}

function createTransfer(targetId, quoteId) {
  return fetch(`${baseUrl}/v1/transfers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      targetAccount: targetId,
      quote: quoteId,
      customerTransactionId: uuid.v4(),
      details: {
        reference: "test reference"
      }
    })
  }).then(res => res.json());
}

function fundTransfer(profileId, transferId) {
  return fetch(`${baseUrl}/v3/profiles/${profileId}/transfers/${transferId}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: "BALANCE",
    })
  }).then(res => res.json());
}

function getAccountBalance(profileId) {
  return fetch(`${baseUrl}/v1/borderless-accounts?profileId=${profileId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  }).then(res => res.json());
}

module.exports = {
  fetchAccountBalance: async () => {
    const profiles = await getProfiles();
    // const personal = profiles.find(p => p.type === 'personal');
    // get currently available balance
    const accounts = await getAccountBalance(profiles[0].id);
    const balances = accounts.flatMap(account => account.balances.find(balance => {
      return balance.currency === 'AUD'
    }))
    return balances[0]
  }
}

