const partnerWalletModel = require("../models/partnerWalletModel");
const partnerTransactionModel = require("../models/partnerTransactionModel");
const withdrawRequestModel = require("../models/withdrawRequestModel");
const bankModel = require("../models/bankModel");

// ===================== Helper ===================== ||

const getOrCreatePartnerWallet = async (partnerId) => {
  let wallet = await partnerWalletModel.findOne({ partnerId });
  if (!wallet) {
    wallet = await partnerWalletModel.create({
      partnerId,
      balance: 0,
      totalEarnings: 0,
      totalWithdrawn: 0,
      totalCommissionPaid: 0,
    });
  }
  return wallet;
};

// ===================== 1) Get My Wallet ===================== ||

exports.getMyWallet = async (req, res) => {
  try {
    const partnerId = req.partner?._id;

    if (!partnerId) {
      return res
        .status(400)
        .json({ success: false, message: "Partner profile not found" });
    }

    const wallet = await getOrCreatePartnerWallet(partnerId);

    return res.status(200).json({
      success: true,
      message: "Partner wallet fetched successfully",
      data: wallet,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===================== 2) Transaction History ===================== ||

exports.getTransactionHistory = async (req, res) => {
  try {
    const partnerId = req.partner?._id;

    if (!partnerId) {
      return res
        .status(400)
        .json({ success: false, message: "Partner profile not found" });
    }

    const {
      page = 1,
      limit = 10,
      orderType,
      transactionType,
      status,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const filter = { partnerId };

    if (orderType) filter.orderType = orderType;
    if (transactionType) filter.transactionType = transactionType;
    if (status) filter.status = status;

    const [wallet, transactions, total] = await Promise.all([
      getOrCreatePartnerWallet(partnerId),
      partnerTransactionModel
        .find(filter)
        .populate("orderId", "orderId status orderTotal")
        .populate("bookingId", "bookingStatus finalPayableAmount")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      partnerTransactionModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Transaction history fetched successfully",
      wallet,
      pagination: {
        totalRecords: total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
      },
      transactions,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===================== 3) Request Withdrawal ===================== ||

exports.requestWithdrawal = async (req, res) => {
  try {
    const partnerId = req.partner?._id;

    if (!partnerId) {
      return res
        .status(400)
        .json({ success: false, message: "Partner profile not found" });
    }

    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Valid amount is required" });
    }

    const wallet = await getOrCreatePartnerWallet(partnerId);

    if (wallet.balance < Number(amount)) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ₹${wallet.balance}`,
      });
    }

    // Check for any existing PENDING withdrawal
    const pendingWithdraw = await withdrawRequestModel.findOne({
      partnerId,
      status: "PENDING",
    });

    if (pendingWithdraw) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending withdrawal request",
      });
    }

    // Get partner bank details
    const bank = await bankModel.findOne({ userId: req.user._id }).select("+accountNumber");

    const bankDetails = bank
      ? {
          accountHolderName: bank.accountHolderName,
          bankName: bank.bankName,
          accountNumber: bank.accountNumber,
          ifscCode: bank.ifscCode,
          upiId: bank.upiId || "",
        }
      : {};

    // Deduct from wallet immediately (prevents double-spend)
    wallet.balance -= Number(amount);
    await wallet.save();

    // Create withdrawal request
    const withdrawRequest = await withdrawRequestModel.create({
      partnerId,
      amount: Number(amount),
      status: "PENDING",
      bankDetails,
    });

    // Create a WITHDRAWAL transaction (PENDING until admin processes)
    await partnerTransactionModel.create({
      partnerId,
      orderType: "ECOMMERCE", // placeholder — withdrawals are not order-specific
      amount: Number(amount),
      commissionPercent: 0,
      commissionAmount: 0,
      netAmount: Number(amount),
      transactionType: "WITHDRAWAL",
      status: "PENDING",
      description: `Withdrawal request of ₹${amount}`,
    });

    return res.status(200).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      data: withdrawRequest,
      walletBalance: wallet.balance,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===================== 4) My Withdrawals ===================== ||

exports.getMyWithdrawals = async (req, res) => {
  try {
    const partnerId = req.partner?._id;

    if (!partnerId) {
      return res
        .status(400)
        .json({ success: false, message: "Partner profile not found" });
    }

    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { partnerId };
    if (status) filter.status = status;

    const [withdrawals, total] = await Promise.all([
      withdrawRequestModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      withdrawRequestModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Withdrawal requests fetched successfully",
      pagination: {
        totalRecords: total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
      },
      data: withdrawals,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
