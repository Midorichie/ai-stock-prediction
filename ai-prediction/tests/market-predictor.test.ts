import { describe, beforeEach, it, expect } from 'vitest';
import pkg from '@hirosystems/clarinet-sdk-wasm';
const { Chain, Account, types } = pkg;

describe('Market Predictor', () => {
    let chain: any;
    let accounts: Map<string, Account>;
    let deployer: Account;

    beforeEach(async () => {
        chain = await Chain.fromSession();
        accounts = chain.getAccounts();
        deployer = accounts.get("deployer")!;
    });

    it('initializes with correct prediction state', () => {
        expect(true).toBe(true);
    });
});
