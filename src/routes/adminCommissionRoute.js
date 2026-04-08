const express = require("express");
const router = express.Router();
const { adminMRoute } = require("../midellwares/auth");
const adminCommissionController = require("../controllers/adminCommissionController");

// All Commissions (with aggregate summary)
router.get("/admin/commissions", adminMRoute, adminCommissionController.getAllCommissions);

// Per-Order Commission
router.get("/admin/commissions/order/:id", adminMRoute, adminCommissionController.getOrderCommission);

// All Partner Wallet Transactions
router.get("/admin/wallet-transactions", adminMRoute, adminCommissionController.getAllWalletTransactions);

// All Partner Wallets Overview
router.get("/admin/partner-wallets", adminMRoute, adminCommissionController.getAllPartnerWallets);

// All Withdraw Requests
router.get("/admin/withdraw-requests", adminMRoute, adminCommissionController.getAllWithdrawRequests);

// Process Withdraw Request (Approve / Reject / Complete)
router.put("/admin/withdraw-requests/:id", adminMRoute, adminCommissionController.processWithdrawRequest);

module.exports = router;
