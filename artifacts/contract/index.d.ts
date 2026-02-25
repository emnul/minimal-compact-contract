import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type MerkleTreePath<T> = { leaf: T;
                                  path: { sibling: { field: bigint },
                                          goes_left: boolean
                                        }[]
                                };

export type Witnesses<PS> = {
  getPathForFoo(context: __compactRuntime.WitnessContext<Ledger, PS>,
                foo_0: Uint8Array): [PS, MerkleTreePath<Uint8Array>];
}

export type ImpureCircuits<PS> = {
  insertFoo(context: __compactRuntime.CircuitContext<PS>, foo_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  proveMtMembership(context: __compactRuntime.CircuitContext<PS>, foo_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  insertFoo(context: __compactRuntime.CircuitContext<PS>, foo_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  proveMtMembership(context: __compactRuntime.CircuitContext<PS>, foo_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
}

export type Ledger = {
  mt: {
    isFull(): boolean;
    checkRoot(rt_0: { field: bigint }): boolean;
    root(): __compactRuntime.MerkleTreeDigest;
    firstFree(): bigint;
    pathForLeaf(index_0: bigint, leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array>;
    findPathForLeaf(leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array> | undefined
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
