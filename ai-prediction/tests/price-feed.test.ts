import { describe, beforeEach, it, expect } from 'vitest';
import pkg from '@hirosystems/clarinet-sdk-wasm';
const { Chain, Account, types, Tx } = pkg;

const CONTRACT_NAME = 'price-feed';

describe('price-feed contract', () => {
    let chain: any;
    let accounts: Map<string, Account>;
    let deployer: Account;
    let wallet1: Account;
    let wallet2: Account;

    beforeEach(async () => {
        chain = await Chain.fromSession();
        accounts = chain.getAccounts();
        deployer = accounts.get("deployer")!;
        wallet1 = accounts.get("wallet_1")!;
        wallet2 = accounts.get("wallet_2")!;
    });

    describe('set-authorized-source', () => {
        it('allows admin to add authorized source', () => {
            const block = chain.mineBlock([
                Tx.contractCall(
                    CONTRACT_NAME,
                    'set-authorized-source',
                    [types.principal(wallet1.address), types.bool(true)],
                    deployer.address
                )
            ]);
            expect(block.receipts[0].result).toBeOk(types.bool(true));
        });

        it('prevents non-admin from adding authorized source', () => {
            const block = chain.mineBlock([
                Tx.contractCall(
                    CONTRACT_NAME,
                    'set-authorized-source',
                    [types.principal(wallet2.address), types.bool(true)],
                    wallet1.address
                )
            ]);
            expect(block.receipts[0].result).toBeErr(types.uint(100)); // err-owner-only
        });
    });

    describe('submit-price-data', () => {
        beforeEach(() => {
            // Authorize wallet1 as a price source
            chain.mineBlock([
                Tx.contractCall(
                    CONTRACT_NAME,
                    'set-authorized-source',
                    [types.principal(wallet1.address), types.bool(true)],
                    deployer.address
                )
            ]);
        });

        it('allows authorized source to submit valid price data', () => {
            const block = chain.mineBlock([
                Tx.contractCall(
                    CONTRACT_NAME,
                    'submit-price-data',
                    [types.uint(50000000), types.uint(50)], // price and weight
                    wallet1.address
                )
            ]);
            expect(block.receipts[0].result).toBeOk(types.bool(true));
        });

        it('prevents unauthorized source from submitting price data', () => {
            const block = chain.mineBlock([
                Tx.contractCall(
                    CONTRACT_NAME,
                    'submit-price-data',
                    [types.uint(50000000), types.uint(50)],
                    wallet2.address
                )
            ]);
            expect(block.receipts[0].result).toBeErr(types.uint(102)); // err-invalid-source
        });

        it('rejects invalid price values', () => {
            const block = chain.mineBlock([
                Tx.contractCall(
                    CONTRACT_NAME,
                    'submit-price-data',
                    [types.uint(1000000001), types.uint(50)], // price exceeds max
                    wallet1.address
                )
            ]);
            expect(block.receipts[0].result).toBeErr(types.uint(101)); // err-invalid-price
        });

        it('rejects invalid weight values', () => {
            const block = chain.mineBlock([
                Tx.contractCall(
                    CONTRACT_NAME,
                    'submit-price-data',
                    [types.uint(50000000), types.uint(101)], // weight exceeds 100
                    wallet1.address
                )
            ]);
            expect(block.receipts[0].result).toBeErr(types.uint(101)); // err-invalid-price
        });
    });

    describe('aggregate-prices', () => {
        beforeEach(() => {
            // Setup multiple price sources
            chain.mineBlock([
                Tx.contractCall(
                    CONTRACT_NAME,
                    'set-authorized-source',
                    [types.principal(wallet1.address), types.bool(true)],
                    deployer.address
                ),
                Tx.contractCall(
                    CONTRACT_NAME,
                    'set-authorized-source',
                    [types.principal(wallet2.address), types.bool(true)],
                    deployer.address
                )
            ]);
        });

        it('aggregates prices when minimum sources requirement is met', () => {
            // Submit prices from multiple sources
            chain.mineBlock([
                Tx.contractCall(
                    CONTRACT_NAME,
                    'submit-price-data',
                    [types.uint(50000000), types.uint(50)],
                    wallet1.address
                ),
                Tx.contractCall(
                    CONTRACT_NAME,
                    'submit-price-data',
                    [types.uint(51000000), types.uint(50)],
                    wallet2.address
                )
            ]);

            const block = chain.mineBlock([
                Tx.contractCall(
                    CONTRACT_NAME,
                    'aggregate-prices',
                    [],
                    deployer.address
                )
            ]);
            expect(block.receipts[0].result).toBeOk(types.bool(true));
        });
    });

    describe('read-only functions', () => {
        it('gets source status correctly', () => {
            // First authorize a source
            chain.mineBlock([
                Tx.contractCall(
                    CONTRACT_NAME,
                    'set-authorized-source',
                    [types.principal(wallet1.address), types.bool(true)],
                    deployer.address
                )
            ]);

            const block = chain.mineBlock([
                Tx.contractCall(
                    CONTRACT_NAME,
                    'get-source-status',
                    [types.principal(wallet1.address)],
                    deployer.address
                )
            ]);
            expect(block.receipts[0].result).toBe(types.bool(true));
        });

        it('gets active sources count correctly', () => {
            const block = chain.mineBlock([
                Tx.contractCall(
                    CONTRACT_NAME,
                    'get-active-sources-count',
                    [],
                    deployer.address
                )
            ]);
            expect(block.receipts[0].result).toBe(types.uint(0));
        });
    });
});
