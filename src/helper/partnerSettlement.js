const partnerWalletModel = require("../models/partnerWalletModel");
const partnerTransactionModel = require("../models/partnerTransactionModel");

/**
 * Settle a partner order — calculate commission, create transaction, credit wallet.
 *
 * @param {Object} params
 * @param {String} params.partnerId        - Partner profile ObjectId
 * @param {String} params.orderId          - Order ObjectId (ecommerce or service)
 * @param {String} params.bookingId        - Booking ObjectId (optional)
 * @param {String} params.orderType        - "ECOMMERCE" | "SERVICE"
 * @param {Number} params.amount           - Gross amount (partner's share before commission)
 * @param {Number} params.commissionPercent - Commission % to deduct
 * @param {String} [params.description]    - Optional description
 * @returns {Object} { transaction, wallet }
 */
async function settlePartnerOrder({
  partnerId,
  orderId,
  bookingId,
  orderType,
  amount,
  commissionPercent,
  description,
}) {
  if (!partnerId || !amount || amount <= 0) {
    throw new Error("partnerId and a positive amount are required for settlement");
  }

  // Prevent duplicate settlement for same order
  const existingTxn = await partnerTransactionModel.findOne({
    partnerId,
    orderId: orderId || undefined,
    bookingId: bookingId || undefined,
    transactionType: "ORDER_CREDIT",
  });

  if (existingTxn) {
    console.log(`⚠️ Settlement already exists for partner ${partnerId}, order ${orderId || bookingId}`);
    return { transaction: existingTxn, wallet: await partnerWalletModel.findOne({ partnerId }), alreadySettled: true };
  }

  // Calculate commission
  const commission = commissionPercent || 0;
  const commissionAmount = Number(((amount * commission) / 100).toFixed(2));
  const netAmount = Number((amount - commissionAmount).toFixed(2));

  // Create partner transaction
  const transaction = await partnerTransactionModel.create({
    partnerId,
    orderId: orderId || null,
    orderModelRef: orderType === "ECOMMERCE" ? "e-commorderModel" : "orderModel",
    bookingId: bookingId || null,
    orderType,
    amount,
    commissionPercent: commission,
    commissionAmount,
    netAmount,
    transactionType: "ORDER_CREDIT",
    status: "COMPLETED",
    description: description || `${orderType} order settlement — ₹${amount} gross, ${commission}% commission deducted`,
  });

  // Upsert partner wallet (create if first time)
  const wallet = await partnerWalletModel.findOneAndUpdate(
    { partnerId },
    {
      $inc: {
        balance: netAmount,
        totalEarnings: netAmount,
        totalCommissionPaid: commissionAmount,
      },
    },
    { new: true, upsert: true }
  );

  console.log(`✅ Partner ${partnerId} settled: ₹${netAmount} credited (₹${commissionAmount} commission)`);

  return { transaction, wallet, alreadySettled: false };
}

module.exports = { settlePartnerOrder };
