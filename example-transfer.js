require('dotenv').config();

const fetch = require('node-fetch');
const uuid = require('uuid');

const baseUrl = process.env.TW_BASE_URL_TEST;
const apiToken = process.env.API_TOKEN_TEST;

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

const banks = [
  {name: "test testington", bsb: "032067", accountNumber: "577740"}
]

const MIN_PAYOUT = 1.20 + 5;
const ACCOUNT_BUFFER = 10;

async function run() {
  // fetch profiles
  const profiles = await getProfiles();
  console.log(profiles);
  // get personal one
  const personal = profiles.find(p => p.type === 'personal');
  // get currently available balance
  const accounts = await getAccountBalance(profiles[0].id);
  const audAccount = accounts.find(a => a.balances.some(b => b.balanceType === 'AVAILABLE' && b.currency === 'AUD'));
  const audBalance = audAccount.balances.find(b => b.balanceType === 'AVAILABLE' && b.currency === 'AUD');
  console.log(audBalance);
  const currentPool = 100;// audBalance.amount - ACCOUNT_BUFFER;
  const payout = currentPool / banks.length
  if (payout > MIN_PAYOUT) {
    const quote = await getQuote(personal.id, payout);
    console.log(quote)
    // double check its possible
    for (const bank of banks) {
      const account = await createAccount(personal.id, bank);
      console.log(account);
      const transfer = await createTransfer(account.id, quote.id);
      console.log(transfer);
      const fund = await fundTransfer(personal.id, transfer.id);
      console.log(fund)
    }
  }
}

run().catch(console.log);
