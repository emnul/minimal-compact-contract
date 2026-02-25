import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type MerkleTreePath<T> = { leaf: T;
                                  path: { sibling: { field: bigint },
                                          goes_left: boolean
                                        }[]
                                };

export type Witnesses<PS> = {
  getPathForFooHash(context: __compactRuntime.WitnessContext<Ledger, PS>,
                    foo_0: Uint8Array): [PS, MerkleTreePath<Uint8Array>];
  getPathForFooNoHash(context: __compactRuntime.WitnessContext<Ledger, PS>,
                      foo_0: bigint): [PS, MerkleTreePath<bigint>];
}

export type ImpureCircuits<PS> = {
  insertFooHash(context: __compactRuntime.CircuitContext<PS>, foo_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  insertFooNoHash(context: __compactRuntime.CircuitContext<PS>, foo_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  proveMtMembershipNoLeafHash(context: __compactRuntime.CircuitContext<PS>,
                              foo_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
  proveMtMembership(context: __compactRuntime.CircuitContext<PS>, foo_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  insertFooHash(context: __compactRuntime.CircuitContext<PS>, foo_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  insertFooNoHash(context: __compactRuntime.CircuitContext<PS>, foo_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  proveMtMembershipNoLeafHash(context: __compactRuntime.CircuitContext<PS>,
                              foo_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
  proveMtMembership(context: __compactRuntime.CircuitContext<PS>, foo_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
}

export type Ledger = {
  mtHashed: {
    isFull(): boolean;
    checkRoot(rt_0: { field: bigint }): boolean;
    root(): __compactRuntime.MerkleTreeDigest;
    firstFree(): bigint;
    pathForLeaf(index_0: bigint, leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array>;
    findPathForLeaf(leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array> | undefined
  };
  mtNoHash: {
    isFull(): boolean;
    checkRoot(rt_0: { field: bigint }): boolean;
    root(): __compactRuntime.MerkleTreeDigest;
    firstFree(): bigint;
    pathForLeaf(index_0: bigint, leaf_0: bigint): __compactRuntime.MerkleTreePath<bigint>;
    findPathForLeaf(leaf_0: bigint): __compactRuntime.MerkleTreePath<bigint> | undefined
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
