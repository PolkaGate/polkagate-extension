import knownSubstrate from '@substrate/ss58-registry';
import { knownGenesis, knownIcon, knownLedger, knownTestnet } from './defaults/index.js';
const UNSORTED = [0, 2, 42];
const TESTNETS = ['testnet'];
function toExpanded(o) {
    const network = o.network || '';
    const nameParts = network.replace(/_/g, '-').split('-');
    const n = o;
    // ledger additions
    n.slip44 = knownLedger[network];
    n.hasLedgerSupport = !!n.slip44;
    // general items
    n.genesisHash = supportedGenesis[network] || [];
    n.icon = knownIcon[network] || 'substrate';
    // filtering
    n.isTestnet = !!knownTestnet[network] || TESTNETS.includes(nameParts[nameParts.length - 1]);
    n.isIgnored = n.isTestnet || (!(o.standardAccount &&
        o.decimals && o.decimals.length &&
        o.symbols && o.symbols.length) &&
        o.prefix !== 42);
    return n;
}
function filterSelectable({ genesisHash, prefix }) {
    return !!genesisHash.length || prefix === 42;
}
function filterAvailable(n) {
    return !n.isIgnored && !!n.network;
}
function sortNetworks(a, b) {
    const isUnSortedA = UNSORTED.includes(a.prefix);
    const isUnSortedB = UNSORTED.includes(b.prefix);
    return isUnSortedA === isUnSortedB
        ? isUnSortedA
            ? 0
            : a.displayName.localeCompare(b.displayName)
        : isUnSortedA
            ? -1
            : 1;
}
// added by PolkaGate
const supportedGenesis = {
    ...knownGenesis,
    westmint: ['0x67f9723393ef76214df0118c34bbbd3dbebc8ed46a10973a8c969d48fe7598c9'],
    polkadotPeople: ['0x67fa177a097bfa18f77ea95ab56e9bcdfeb0e5b8a40e46298bb93e16b6fc5008'],
    westendPeople: ['0x1eb6fb0ba5187434de017a70cb84d4f47142df1d571d0ef9e7e1407f2b80b93c'],
    kusamaPeople: ['0xc1af4cb4eb3918e5db15086c0cc5ec17fb334f728b7c65dd44bfe1e174ff8b3f'],
    paseo: ['0x77afd6190f1554ad45fd0d31aee62aacc33c6db0ea801129acb813f913e0764f'],
    paseoAssetHub: ['0x862ce2fa5abfdc3d29ead85a9472071efc69433b0128db1d6f009967fae87952'],
    aleph: ['0x70255b4d28de0fc4e1a193d7e175ad1ccef431598211c55538f1018651a0344e'],
    polkadexparachain: ['0x72f3bba34b1ecd532bccbed46701ad37c4ef329bfe86b7cf014ac06cb92ed47d'],
}

const testnets = [{
    "prefix": 42,
    "network": "westend",
    "displayName": "Westend",
    "symbols": ["WND"],
    "decimals": [12],
    "standardAccount": "*25519",
    "website": "https://polkadot.network"
},
{
    "prefix": 42,
    "network": "paseo",
    "displayName": "Paseo Testnet",
    "symbols": ["PAS"],
    "decimals": [10],
    "standardAccount": "*25519",
    "website": "https://polkadot.network"
}];

const assetHubs = [{
    "prefix": 42,
    "network": "westmint",
    "displayName": "Westend Asset Hub",
    "symbols": ["WND"],
    "decimals": [12],
    "standardAccount": "*25519",
    "website": "https://polkadot.network"
},
 {
    "prefix": 2,
    "network": "statemine",
    "displayName": "Kusama Asset Hub",
    "symbols": ["KSM"],
    "decimals": [12],
    "standardAccount": "*25519",
    "website": "https://kusama.network"
},
 {
    "prefix": 0,
    "network": "statemint",
    "displayName": "Polkadot Asset Hub",
    "symbols": ["DOT"],
    "decimals": [10],
    "standardAccount": "*25519",
    "website": "https://polkadot.network"
},
{
    "prefix": 0,
    "network": "paseoAssetHub",
    "displayName": "Paseo Asset Hub",
    "symbols": ["PAS"],
    "decimals": [10],
    "standardAccount": "*25519",
    "website": "https://polkadot.network"
}];

const peopleChains = [
    {
        "prefix": 42,
        "network": "westendPeople",
        "displayName": "Westend People",
        "symbols": ["WND"],
        "decimals": [12],
        "standardAccount": "*25519",
        "website": "https://polkadot.network"
    },
    {
        "prefix": 2,
        "network": "kusamaPeople",
        "displayName": "Kusama People",
        "symbols": ["KSM"],
        "decimals": [12],
        "standardAccount": "*25519",
        "website": "https://kusama.network"
    },
    {
        "prefix": 0,
        "network": "polkadotPeople",
        "displayName": "Polkadot People",
        "symbols": ["DOT"],
        "decimals": [10],
        "standardAccount": "*25519",
        "website": "https://polkadot.network"
    }
];

const liveChains = [
    {
        "prefix": 42,
        "network": "aleph",
        "displayName": "Aleph Zero",
        "symbols": ["AZERO"],
        "decimals": [12],
        "standardAccount": "*25519",
        "website": "https://alephZero.org"
    }
];

knownSubstrate.push(...assetHubs, ...peopleChains, ...testnets, ...liveChains);
export const allNetworks = knownSubstrate.map(toExpanded);
export const availableNetworks = allNetworks.filter(filterAvailable).sort(sortNetworks);
export const selectableNetworks = availableNetworks.filter(filterSelectable);
