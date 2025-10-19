from algopy import (
    ARC4Contract,
    Account,
    Asset,
    Global,
    GlobalState,
    LocalState,
    StateTotals,
    Txn,
    UInt64,
    gtxn,
    itxn,
)
from algopy.arc4 import abimethod

class LiquidBurnApp(
    ARC4Contract,
    state_totals=StateTotals(global_uints=5, global_bytes=1, local_uints=1, local_bytes=0),
):
    """Liquid burn contract that tracks burned ASA and distributes Algo rewards."""

    @abimethod(create="require")
    def initialize(self, asset_id: UInt64, admin: Account) -> None:
        """Run on app creation to configure the burn asset and admin account."""
        is_initialized = GlobalState(UInt64, key="is_initialized")

        assert is_initialized.get(UInt64(0)) != UInt64(1), "already initialized"
        assert Txn.sender == Global.creator_address, "only creator can initialize"

        burn_asset = GlobalState(UInt64, key="burn_asset")
        admin_state = GlobalState(Account, key="admin")
        total_burned = GlobalState(UInt64, key="total_burned")
        total_shares = GlobalState(UInt64, key="total_shares")
        reward_pool = GlobalState(UInt64, key="reward_pool")

        burn_asset.value = asset_id
        admin_state.value = admin
        is_initialized.value = UInt64(1)

        # Reset aggregate counters
        total_burned.value = UInt64(0)
        total_shares.value = UInt64(0)
        reward_pool.value = UInt64(0)

    @abimethod()
    def fund(self) -> None:
        """
        Increase the reward pool by pairing this call with a payment transaction.

        Expected group: [payment from admin -> app], [app call to `fund`]
        """
        admin_state = GlobalState(Account, key="admin")
        reward_pool = GlobalState(UInt64, key="reward_pool")

        admin = admin_state.value
        assert Txn.sender == admin, "only admin can fund rewards"
        assert Txn.group_index != UInt64(0), "fund must follow a payment transfer"

        payment = gtxn.PaymentTransaction(Txn.group_index - UInt64(1))
        assert (
            payment.receiver == Global.current_application_address
        ), "funding payment must target the app account"
        assert payment.sender == admin, "funding payment must come from admin"

        reward_pool.value = reward_pool.value + payment.amount

    @abimethod()
    def burn(self, amount: UInt64) -> UInt64:
        """
        Record a burn by pairing this call with an ASA transfer into the contract.

        Expected group: [asset transfer of `amount` to app], [app call to `burn`]
        Returns the caller's new share balance.
        """
        is_initialized = GlobalState(UInt64, key="is_initialized")
        burn_asset = GlobalState(UInt64, key="burn_asset")
        total_shares = GlobalState(UInt64, key="total_shares")
        total_burned = GlobalState(UInt64, key="total_burned")
        shares_state = LocalState(UInt64, key="shares")

        assert is_initialized.get(UInt64(0)) == UInt64(1), "contract not initialized"
        assert amount != UInt64(0), "burn amount must be positive"
        assert Txn.group_index != UInt64(0), "burn must follow an asset transfer"

        asset_xfer = gtxn.AssetTransferTransaction(Txn.group_index - UInt64(1))
        assert asset_xfer.sender == Txn.sender, "asset sender must match app caller"
        assert (
            asset_xfer.asset_receiver == Global.current_application_address
        ), "asset must be sent to the app account"
        assert (
            asset_xfer.xfer_asset == Asset(burn_asset.value)
        ), "asset id does not match initialized burn asset"
        assert asset_xfer.asset_amount == amount, "asset transfer amount mismatch"

        current_shares = shares_state.get(Txn.sender, UInt64(0))
        new_balance = current_shares + amount

        shares_state[Txn.sender] = new_balance
        total_shares.value = total_shares.value + amount
        total_burned.value = total_burned.value + amount

        return new_balance

    @abimethod()
    def claim(self) -> UInt64:
        """
        Redeem accumulated rewards proportional to the caller's shares.

        Returns the payout amount in microalgos.
        """
        reward_pool = GlobalState(UInt64, key="reward_pool")
        total_shares = GlobalState(UInt64, key="total_shares")
        shares_state = LocalState(UInt64, key="shares")

        shares = shares_state.get(Txn.sender, UInt64(0))
        assert shares != UInt64(0), "no shares to claim"
        assert total_shares.value != UInt64(0), "no outstanding shares"

        payout = (reward_pool.value * shares) // total_shares.value
        assert payout != UInt64(0), "reward pool too small to claim"

        reward_pool.value = reward_pool.value - payout
        total_shares.value = total_shares.value - shares

        # Clear the caller's share balance.
        del shares_state[Txn.sender]

        itxn.Payment(
            amount=payout,
            receiver=Txn.sender,
            fee=UInt64(0),
        ).submit()

        return payout
