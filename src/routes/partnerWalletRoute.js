const express = require("express");
const router = express.Router();
const { partnerRoute } = require("../midellwares/auth");
const partnerWalletController = require("../controllers/partnerWalletController");

// Partner Wallet
router.get("/partner/wallet", partnerRoute, partnerWalletController.getMyWallet);

// Partner Transaction History
router.get("/partner/wallet/transactions", partnerRoute, partnerWalletController.getTransactionHistory);

// Request Withdrawal
router.post("/partner/wallet/withdraw", partnerRoute, partnerWalletController.requestWithdrawal);

// My Withdrawals
router.get("/partner/wallet/withdrawals", partnerRoute, partnerWalletController.getMyWithdrawals);

module.exports = router;
