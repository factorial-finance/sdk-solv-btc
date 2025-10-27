"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Oracle = exports.Opcodes = void 0;
exports.oracleConfigToCell = oracleConfigToCell;
const core_1 = require("@ton/core");
function oracleConfigToCell(config) {
    return (0, core_1.beginCell)()
        .storeCoins(config.nav)
        .storeCoins(config.navDecimals)
        .storeAddress(config.navManager)
        .storeAddress(config.adminAddress)
        .storeRef((0, core_1.beginCell)()
        .storeAddress(config.nextAdminAddress)
        .storeAddress(config.vaultAddress)
        .endCell())
        .endCell();
}
exports.Opcodes = {
    provideAccountStatusAndLock: 0xbf281c87,
    ExecuteAction: 0x2be12d37,
};
class Oracle {
    constructor(address, init) {
        this.address = address;
        this.init = init;
    }
    static createFromAddress(address) {
        return new Oracle(address);
    }
    static createFromConfig(config, code, workchain = 0) {
        const data = oracleConfigToCell(config);
        const init = { code, data };
        const address = (0, core_1.contractAddress)(workchain, init);
        return new Oracle(address, init);
    }
    async sendDeploy(provider, via, value) {
        await provider.internal(via, {
            value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)().endCell(),
        });
    }
    async sendSetNav(provider, via, params) {
        await provider.internal(via, {
            value: (0, core_1.toNano)("0.1"),
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(Oracle.Op.SetNav, 32) // op::set_nav
                .storeUint(params.queryId ?? 0, 64)
                .storeCoins(params.nav)
                .endCell(),
        });
    }
    async sendSetMaxNavChange(provider, via, params) {
        await provider.internal(via, {
            value: (0, core_1.toNano)("0.1"),
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(Oracle.Op.SetMaxNavChange, 32) // op::set_max_nav_change
                .storeUint(params.queryId ?? 0, 64)
                .storeCoins(params.maxNavChange)
                .endCell(),
        });
    }
    async sendSetNavManager(provider, via, params) {
        await provider.internal(via, {
            value: (0, core_1.toNano)("0.1"),
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(Oracle.Op.SetNavManager, 32) // op::set_nav_manager
                .storeUint(params.queryId ?? 0, 64)
                .storeAddress(params.navManager)
                .endCell(),
        });
    }
    async sendChangeAdmin(provider, via, params) {
        await provider.internal(via, {
            value: (0, core_1.toNano)("0.1"),
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(Oracle.Op.ChangeAdmin, 32) // op::change_admin
                .storeUint(params.queryId ?? 0, 64)
                .storeAddress(params.newAdmin)
                .endCell(),
        });
    }
    async sendClaimAdmin(provider, via, params) {
        await provider.internal(via, {
            value: (0, core_1.toNano)("0.1"),
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(Oracle.Op.ClaimAdmin, 32) // op::claim_admin
                .storeUint(params.queryId ?? 0, 64)
                .endCell(),
        });
    }
    async sendUpgradeCode(provider, via, value, newCode) {
        await provider.internal(via, {
            value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(Oracle.Op.UpgradeCode, 32)
                .storeUint(0, 64)
                .storeRef(newCode)
                .endCell(),
        });
    }
    async sendProvideNav(provider, via, params) {
        await provider.internal(via, {
            value: (0, core_1.toNano)("0.1"),
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(Oracle.Op.ProvideNav, 32) // op::provide_nav
                .storeUint(params.queryId ?? 0, 64)
                .storeRef(params.forwardPayload)
                .endCell(),
        });
    }
    async getState(provider) {
        return await provider.getState();
    }
    async getOracleData(provider) {
        const state = await provider.getState();
        if (state.state.type !== "active")
            throw "not active";
        if (!state.state.data)
            throw "not active";
        return Oracle.parseOracleStorage(core_1.Cell.fromBoc(state.state.data)[0].beginParse());
    }
    static parseOracleStorage(slice) {
        const nav = slice.loadCoins();
        const navDecimals = slice.loadCoins();
        const navManager = slice.loadAddress();
        const adminAddress = slice.loadAddress();
        const ref0 = slice.loadRef().beginParse();
        const nextAdminAddress = ref0.loadAddress();
        const vaultAddress = ref0.loadAddress();
        return {
            nav,
            navDecimals,
            navManager,
            adminAddress,
            nextAdminAddress,
            vaultAddress,
        };
    }
    // Event parsing methods
    static parseSetNavEvent(body) {
        const slice = body instanceof core_1.Cell ? body.beginParse() : body;
        const preNav = slice.loadCoins();
        const newNav = slice.loadCoins();
        const navDecimals = slice.loadCoins();
        return { preNav, newNav, navDecimals };
    }
    static parseSetNavManagerEvent(body) {
        const slice = body instanceof core_1.Cell ? body.beginParse() : body;
        const navManagerAddress = slice.loadAddress();
        return { navManagerAddress };
    }
    static parseChangeAdminEvent(body) {
        const slice = body instanceof core_1.Cell ? body.beginParse() : body;
        const newNextAdminAddress = slice.loadAddress();
        return { newNextAdminAddress };
    }
    static parseClaimAdminEvent(body) {
        const slice = body instanceof core_1.Cell ? body.beginParse() : body;
        const newAdminAddress = slice.loadAddress();
        return { newAdminAddress };
    }
    static parseUpgradeCodeEvent(body) {
        const slice = body instanceof core_1.Cell ? body.beginParse() : body;
        const codeHash = slice.loadUintBig(256);
        return { codeHash };
    }
    // Generic event parser
    static parseEvent(eventName, body) {
        switch (eventName) {
            case Oracle.Event.SetNav:
                return Oracle.parseSetNavEvent(body);
            case Oracle.Event.SetNavManager:
                return Oracle.parseSetNavManagerEvent(body);
            case Oracle.Event.ChangeAdmin:
                return Oracle.parseChangeAdminEvent(body);
            case Oracle.Event.ClaimAdmin:
                return Oracle.parseClaimAdminEvent(body);
            case Oracle.Event.UpgradeCode:
                return Oracle.parseUpgradeCodeEvent(body);
            default:
                throw new Error(`Unknown event type: ${eventName}`);
        }
    }
}
exports.Oracle = Oracle;
Oracle.Op = {
    ProvideNav: 0xc57779f2,
    TakeNav: 0x396297f6,
    SetNav: 0x6cbc3612,
    SetMaxNavChange: 0x65f3982d,
    SetNavManager: 0x4a8b2bb8,
    ProvideWithdrawFeeRatio: 0x8cde1508,
    TakeWithdrawFeeRatio: 0x2a38f37c,
    ChangeAdmin: 0xb6801836,
    ClaimAdmin: 0x37f6346c,
    UpgradeCode: 0x61bddf8b,
};
Oracle.Error = {
    NotAdmin: 1000,
    NotNavManager: 1001,
    NotNextAdmin: 1002,
    InvalidNav: 1003,
    WrongOp: 0xffff,
};
Oracle.Event = {
    SetNav: "event::set_nav",
    SetNavManager: "event::set_nav_manager",
    ChangeAdmin: "event::change_admin",
    ClaimAdmin: "event::claim_admin",
    UpgradeCode: "event::upgrade_code",
};
//# sourceMappingURL=Oracle.js.map