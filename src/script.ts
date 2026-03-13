import * as utils from "./address.js"
import { getRandomValues } from 'crypto';
import {
  Contract,
  type Ledger,
  type MerkleTreePath,
  type ZswapCoinPublicKey,
  type Witnesses,
} from '../artifacts/contract/index.js';
import { createConstructorContext, sampleContractAddress, QueryContext, CostModel, WitnessContext, persistentHash, CoinPublicKey, CompactTypeField, leafHash, CompactTypeVector, CompactTypeBytes, convertFieldToBytes, encodeCoinPublicKey } from '@midnight-ntwrk/compact-runtime';

const INSTANCE_SALT = new Uint8Array(32).fill(48473095);
const COMMITMENT_DOMAIN = 'ShieldedAccessControl:commitment';
const NULLIFIER_DOMAIN = 'ShieldedAccessControl:nullifier';
const ACCOUNT_DOMAIN = 'ShieldedAccessControl:accountId';

const DEFAULT_MT_PATH: MerkleTreePath<Uint8Array> = {
  leaf: new Uint8Array(32),
  path: Array.from({ length: 20 }, () => ({
    sibling: { field: 0n },
    goes_left: false,
  })),
};

const RETURN_BAD_PATH = (
  ctx: WitnessContext<Ledger, ShieldedAccessControlPrivateState>,
  _commitment: Uint8Array,
): [ShieldedAccessControlPrivateState, MerkleTreePath<Uint8Array>] => {
  return [ctx.privateState, DEFAULT_MT_PATH];
};

// Helpers
const buildAccountIdHash = (
  pk: ZswapCoinPublicKey,
  nonce: Uint8Array,
): Uint8Array => {
  const rt_type = new CompactTypeVector(4, new CompactTypeBytes(32));

  const bPK = pk.bytes;
  const bDomain = new TextEncoder().encode(ACCOUNT_DOMAIN);
  return persistentHash(rt_type, [bPK, nonce, INSTANCE_SALT, bDomain]);
};

const buildRoleCommitmentHash = (
  role: Uint8Array,
  accountId: Uint8Array,
): Uint8Array => {
  const rt_type = new CompactTypeVector(4, new CompactTypeBytes(32));
  const bDomain = new TextEncoder().encode(COMMITMENT_DOMAIN);

  const commitment = persistentHash(rt_type, [
    role,
    accountId,
    INSTANCE_SALT,
    bDomain,
  ]);
  return commitment;
};

const buildNullifierHash = (commitment: Uint8Array): Uint8Array => {
  const rt_type = new CompactTypeVector(2, new CompactTypeBytes(32));
  const bDomain = new TextEncoder().encode(NULLIFIER_DOMAIN);

  const nullifier = persistentHash(rt_type, [commitment, bDomain]);
  return nullifier;
};

class ShieldedAccessControlConstant {
  baseString: string;
  publicKey: string;
  zPublicKey: ZswapCoinPublicKey;
  role: Buffer;
  accountId: Uint8Array;
  roleNullifier: Uint8Array;
  roleCommitment: Uint8Array;
  secretNonce: Buffer;

  constructor(baseString: string, roleIdentifier: bigint) {
    this.baseString = baseString;
    [this.publicKey, this.zPublicKey] = utils.generatePubKeyPair(baseString);
    this.secretNonce = Buffer.alloc(32, `${baseString}_NONCE`);
    this.accountId = buildAccountIdHash(this.zPublicKey, this.secretNonce);
    this.role = Buffer.from(convertFieldToBytes(32, roleIdentifier, ''));
    this.roleCommitment = buildRoleCommitmentHash(this.role, this.accountId);
    this.roleNullifier = buildNullifierHash(this.roleCommitment);
  }
}

const ADMIN = new ShieldedAccessControlConstant('ADMIN', 0n);

/**
 * @description Interface defining the witness methods for ShieldedAccessControl operations.
 * @template P - The private state type.
 */
export interface IShieldedAccessControlWitnesses<P> {
  /**
   * Retrieves the secret nonce from the private state.
   * @param context - The witness context containing the private state.
   * @returns A tuple of the private state and the secret nonce as a Uint8Array.
   */
  wit_secretNonce(
    context: WitnessContext<Ledger, P>,
    role: Uint8Array,
  ): [P, Uint8Array];
  wit_getRoleCommitmentPath(
    context: WitnessContext<Ledger, P>,
    roleCommitment: Uint8Array,
  ): [P, MerkleTreePath<Uint8Array>];
}

type role = string;
type SecretNonce = Uint8Array;

/**
 * @description Represents the private state of a Shielded AccessControl contract, storing
 * mappings from a 32 byte hex string to a 32 byte secret nonce.
 */
export type ShieldedAccessControlPrivateState = {
  /** @description A 32-byte secret nonce used as a privacy additive. */
  roles: Record<role, SecretNonce>;
};

/**
 * @description Utility object for managing the private state of a Shielded AccessControl contract.
 */
export const ShieldedAccessControlPrivateState = {
  /**
   * @description Generates a new private state with a random secret nonce and a default role of 0.
   * @returns A fresh ShieldedAccessControlPrivateState instance.
   */
  generate: (): ShieldedAccessControlPrivateState => {
    const defaultRoleId: string = Buffer.alloc(32).toString('hex');
    const secretNonce = new Uint8Array(getRandomValues(Buffer.alloc(32)));

    return { roles: { [defaultRoleId]: secretNonce } };
  },

  /**
   * @description Generates a new private state with a user-defined secret nonce.
   * Useful for deterministic nonce generation or advanced use cases.
   *
   * @param nonce - The 32-byte secret nonce to use.
   * @returns A fresh ShieldedAccessControlPrivateState instance with the provided nonce.
   *
   * @example
   * ```typescript
   * // For deterministic nonces (user-defined scheme)
   * const deterministicNonce = myDeterministicScheme(...);
   * const privateState = ShieldedAccessControlPrivateState.withNonce(deterministicNonce);
   * ```
   */
  withRoleAndNonce: (
    role: Buffer,
    nonce: Buffer,
  ): ShieldedAccessControlPrivateState => {
    const roleString = role.toString('hex');
    return { roles: { [roleString]: nonce } };
  },

  setRole: (
    privateState: ShieldedAccessControlPrivateState,
    role: Buffer,
    nonce: Buffer,
  ): ShieldedAccessControlPrivateState => {
    const roleString = role.toString('hex');
    privateState.roles[roleString] = nonce;
    return privateState;
  },

  getRoleCommitmentPath: (
    ledger: Ledger,
    roleCommitment: Uint8Array,
  ): MerkleTreePath<Uint8Array> => {
    const path =
      ledger._operatorRoles.findPathForLeaf(
        roleCommitment,
      );
    const defaultPath: MerkleTreePath<Uint8Array> = {
      leaf: new Uint8Array(32),
      path: Array.from({ length: 20 }, () => ({
        sibling: { field: 0n },
        goes_left: false,
      })),
    };
    return path ? path : defaultPath;
  },
};

/**
 * @description Factory function creating witness implementations for Shielded AccessControl operations.
 * @returns An object implementing the Witnesses interface for ShieldedAccessControlPrivateState.
 */
export const ShieldedAccessControlWitnesses =
  (): IShieldedAccessControlWitnesses<ShieldedAccessControlPrivateState> => ({
    wit_secretNonce(
      context: WitnessContext<Ledger, ShieldedAccessControlPrivateState>,
      role: Uint8Array,
    ): [ShieldedAccessControlPrivateState, Uint8Array] {
      const roleString = Buffer.from(role).toString('hex');
      return [context.privateState, context.privateState.roles[roleString]];
    },
    wit_getRoleCommitmentPath(
      context: WitnessContext<Ledger, ShieldedAccessControlPrivateState>,
      roleCommitment: Uint8Array,
    ): [ShieldedAccessControlPrivateState, MerkleTreePath<Uint8Array>] {
      return [
        context.privateState,
        ShieldedAccessControlPrivateState.getRoleCommitmentPath(
          context.ledger,
          roleCommitment,
        ),
      ];
    },
  });

const contract = new Contract<ShieldedAccessControlPrivateState, IShieldedAccessControlWitnesses<ShieldedAccessControlPrivateState>>(ShieldedAccessControlWitnesses());
const initCtx = createConstructorContext(ShieldedAccessControlPrivateState.withRoleAndNonce(ADMIN.role, ADMIN.secretNonce), ADMIN.zPublicKey);
const {
  currentPrivateState,
  currentContractState,
  currentZswapLocalState,
} = contract.initialState(initCtx, INSTANCE_SALT);
// Extract ChargedState from the compiler-generated ContractState
const chargedState = currentContractState.data;

let context = {
  currentPrivateState,
  currentZswapLocalState,
  currentQueryContext: new QueryContext(chargedState, sampleContractAddress()),
  costModel: CostModel.initialCostModel(),
};

let results = contract.circuits.doStuff(context, ADMIN.role, ADMIN.zPublicKey);
context = results.context;

console.log('ADMIN zpub key: ', ADMIN.zPublicKey.bytes);
console.log('ADMIN pub key: ', ADMIN.publicKey);
console.log('admin accountId: ', ADMIN.accountId);
console.log('nonce: ', new Uint8Array(ADMIN.secretNonce))
console.log(JSON.stringify(results.proofData, null, 2))