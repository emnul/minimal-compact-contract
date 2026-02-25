import {
  Contract,
  type Ledger,
  type MerkleTreePath,
  type Witnesses,
} from '../artifacts/contract/index.js';
import { createConstructorContext, sampleContractAddress, QueryContext, CostModel, WitnessContext, persistentHash, CompactTypeField } from '@midnight-ntwrk/compact-runtime';

const witnesses = {
  getPathForFooHash(context: WitnessContext<Ledger, {}>, foo: Uint8Array): [{}, MerkleTreePath<Uint8Array>] {
    let path =
      context.ledger.mtHashed.findPathForLeaf(
        foo,
      );
    console.log("Path results: ", path, "\n");
    const defaultPath: MerkleTreePath<Uint8Array> = {
      leaf: new Uint8Array(32),
      path: Array.from({ length: 10 }, () => ({
        sibling: { field: 0n },
        goes_left: false,
      })),
    };
    path = path ? path : defaultPath;
    return [{}, path]
  },
  getPathForFooNoHash(context: WitnessContext<Ledger, {}>, foo: bigint): [{}, MerkleTreePath<bigint>] {
    let path =
      context.ledger.mtNoHash.findPathForLeaf(
        foo,
      );
    console.log("Path results: ", path, "\n");
    const defaultPath: MerkleTreePath<bigint> = {
      leaf: 0n,
      path: Array.from({ length: 10 }, () => ({
        sibling: { field: 0n },
        goes_left: false,
      })),
    };
    path = path ? path : defaultPath;
    return [{}, path]
  }
}

const contract = new Contract<{}, Witnesses<{}>>(witnesses);
const initCtx = createConstructorContext({}, '0'.repeat(64));
const {
  currentPrivateState,
  currentContractState,
  currentZswapLocalState,
} = contract.initialState(initCtx);
// Extract ChargedState from the compiler-generated ContractState
const chargedState = currentContractState.data;

let context = {
  currentPrivateState,
  currentZswapLocalState,
  currentQueryContext: new QueryContext(chargedState, sampleContractAddress()),
  costModel: CostModel.initialCostModel(),
};

let results = contract.circuits.insertFooHash(context, 1n);
context = results.context;

let membershipResults = contract.circuits.proveMtMembershipNoLeafHash(context, 1n);
context = membershipResults.context;

console.log("membershipResult: ", membershipResults.result, "\n");

results = contract.circuits.insertFooNoHash(context, 1n);
context = results.context;

membershipResults = contract.circuits.proveMtMembership(context, 1n);
context = membershipResults.context;

console.log("membershipResult: ", membershipResults.result, "\n");
