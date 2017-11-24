import React from 'react';
import { feathersClient } from './feathersClient';
import DefaultAvatar from './../assets/avatar-100.svg';
import 'whatwg-fetch';

export const isOwner = (address, currentUser) =>
  address !== undefined && currentUser !== undefined && currentUser.address === address;


export const authenticate = (wallet) => {
  const authData = {
    strategy: 'web3',
    address: wallet.getAddresses()[0],
  };

  return new Promise((resolve, reject) => {
    feathersClient.authenticate(authData)
      .catch((response) => {
        // normal flow will issue a 401 with a challenge message we need to sign and send to
        // verify our identity
        if (response.code === 401 && response.data.startsWith('Challenge =')) {
          const msg = response.data.replace('Challenge =', '').trim();

          return resolve(wallet.signMessage(msg).signature);
        }
        return reject(response);
      });
  }).then((signature) => {
    authData.signature = signature;
    return feathersClient.authenticate(authData);
  }).then((response) => {
    console.log('Authenticated!');
    return response.accessToken;
  });
};

export const getTruncatedText = (text, maxLength) => {
  const txt = text.replace(/<(?:.|\n)*?>/gm, '').trim();
  if (txt.length > maxLength) {
    return `${txt.substr(0, maxLength).trim()}...`;
  }
  return txt;
};

// displays a sweet alert with an error when the transaction goes wrong
export const displayTransactionError = (txHash) => {
  let msg;
  if (txHash) {
    msg = (
      <p>Something went wrong with the transaction.
        <a
          href={`{etherScanUrl}tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
        >View transaction
        </a>
      </p>);
    // TODO update or remove from feathers? maybe don't remove, so we can inform the user that the
    // tx failed and retry
  } else {
    msg = <p>Something went wrong with the transaction. Is your wallet unlocked?</p>;
  }

  React.swal({
    title: 'Oh no!',
    content: React.swal.msg(msg),
    icon: 'error',
  });
};


// returns the user name, or if no user name, returns default name
export const getUserName = (owner) => {
  if (owner && owner.name) {
    return owner.name;
  }
  return 'Anonymous user';
};


// returns the user avatar, or if no user avatar, returns default avatar
export const getUserAvatar = (owner) => {
  if (owner && owner.avatar) {
    return owner.avatar;
  }
  return DefaultAvatar;
};

export const getRandomWhitelistAddress = wl => wl[Math.floor(Math.random() * wl.length)];

export const getGasPrice = () => {
  return feathersClient.service('/gasprice').find().then((resp) => { return resp.average * 2 })
}


// returns a risk indicator
export const calculateRiskFactor = (owner, dependencies) => {
  const reasons = {
    risk: 0,
    hasName: true,
    hasAvatar: true,
    hasEmail: true,
    hasLinkedIn: true,
    hasDependencies: true,
  };

  if (!owner.name) {
    reasons.risk += 3;
    reasons.hasName = false;
  }

  if (!owner.avatar) {
    reasons.risk += 2;
    reasons.hasAvatar = false;
  }

  if (!owner.email) {
    reasons.risk += 15;
    reasons.hasEmail = false;
  }

  if (!owner.linkedIn) {
    reasons.risk += 35;
    reasons.hasLinkedIn = false;
  }

  if (dependencies === 0) {
    reasons.risk += 40;
    reasons.hasDependencies = false;
  }

  return reasons;
};