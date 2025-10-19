import logging
import os

import algokit_utils

logger = logging.getLogger(__name__)


# define deployment behaviour based on supplied app spec
def deploy() -> None:
    from smart_contracts.artifacts.liquid_burn_app.liquid_burn_app_client import (
        InitializeArgs,
        LiquidBurnAppMethodCallCreateParams,
        LiquidBurnAppFactory,
    )

    algorand = algokit_utils.AlgorandClient.from_environment()
    deployer_ = algorand.account.from_environment("DEPLOYER")

    factory = algorand.client.get_typed_app_factory(
        LiquidBurnAppFactory, default_sender=deployer_.address
    )

    asset_id = int(os.getenv("LIQUID_BURN_ASSET_ID", "0"))

    app_client, result = factory.deploy(
        on_update=algokit_utils.OnUpdate.AppendApp,
        on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
        create_params=LiquidBurnAppMethodCallCreateParams(
            args=InitializeArgs(asset_id=asset_id, admin=deployer_.address),
        ),
    )

    if result.operation_performed in [
        algokit_utils.OperationPerformed.Create,
        algokit_utils.OperationPerformed.Replace,
    ]:
        algorand.send.payment(
            algokit_utils.PaymentParams(
                amount=algokit_utils.AlgoAmount(algo=1),
                sender=deployer_.address,
                receiver=app_client.app_address,
            )
        )

    logger.info(
        "LiquidBurnApp deployed at app_id=%s with asset_id=%s and admin=%s",
        app_client.app_id,
        asset_id,
        deployer_.address,
    )
