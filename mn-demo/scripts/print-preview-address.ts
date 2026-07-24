import { Buffer } from 'buffer';
import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { HDWallet, Roles, createKeystore } from '@midnight-ntwrk/wallet-sdk';
import { getOrCreateSeed } from './src/network.ts';

setNetworkId('preview');
const seed = getOrCreateSeed('preview');
const hdWallet = HDWallet.fromSeed(Buffer.from(seed, 'hex'));
if (hdWallet.type !== 'seedOk') throw new Error('bad seed');
const result = hdWallet.hdWallet
  .selectAccount(0)
  .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
  .deriveKeysAt(0);
if (result.type !== 'keysDerived') throw new Error('bad keys');
const ks = createKeystore(result.keys[Roles.NightExternal], getNetworkId());
console.log(ks.getBech32Address().toString());
