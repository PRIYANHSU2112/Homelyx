const partnerWalletModel = require("../models/partnerWalletModel");
const partnerTransactionModel = require("../models/partnerTransactionModel");
const withdrawRequestModel = require("../models/withdrawRequestModel");

// ===================== 1) Get All Commissions ===================== ||

exports.getAllCommissions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      partnerId,
      orderType,
      startDate,
      endDate,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const filter = { transactionType: "ORDER_CREDIT" };

    if (partnerId) filter.partnerId = partnerId;
    if (orderType) filter.orderType = orderType;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [transactions, total, aggregation] = await Promise.all([
      partnerTransactionModel
        .find(filter)
        .populate("partnerId", "name email phoneNumber userId")
        .populate("orderId", "orderId status orderTotal")
        .populate("bookingId", "bookingStatus finalPayableAmount")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      partnerTransactionModel.countDocuments(filter),
      partnerTransactionModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalGrossAmount: { $sum: "$amount" },
            totalCommission: { $sum: "$commissionAmount" },
            totalNetCredited: { $sum: "$netAmount" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const summary = aggregation[0] || {
      totalGrossAmount: 0,
      totalCommission: 0,
      totalNetCredited: 0,
      count: 0,
    };

    return res.status(200).json({
      success: true,
      message: "All commissions fetched successfully",
      summary: {
        totalGrossAmount: summary.totalGrossAmount,
        totalCommission: summary.totalCommission,
        totalNetCredited: summary.totalNetCredited,
        totalOrders: summary.count,
      },
      pagination: {
        totalRecords: total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
      },
      data: transactions,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===================== 2) Get Per-Order Commission ===================== ||

exports.getOrderCommission = async (req, res) => {
  try {
    const { id } = req.params;

    // Search by orderId or bookingId
    const transaction = await partnerTransactionModel
      .findOne({
        $or: [{ orderId: id }, { bookingId: id }],
        transactionType: "ORDER_CREDIT",
      })
      .populate("partnerId", "name email phoneNumber userId")
      .populate("orderId", "orderId status orderTotal product")
      .populate("bookingId", "bookingStatus finalPayableAmount subCategoryId");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Commission record not found for this order",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order commission fetched successfully",
      data: {
        orderId: transaction.orderId,
        bookingId: transaction.bookingId,
        orderType: transaction.orderType,
        grossAmount: transaction.amount,
        commissionPercent: transaction.commissionPercent,
        commissionAmount: transaction.commissionAmount,
        netCreditedToPartner: transaction.netAmount,
        partner: transaction.partnerId,
        settledAt: transaction.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===================== 3) All Wallet Transactions ===================== ||

exports.getAllWalletTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      partnerId,
      transactionType,
      status,
      orderType,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (partnerId) filter.partnerId = partnerId;
    if (transactionType) filter.transactionType = transactionType;
    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;

    const [transactions, total] = await Promise.all([
      partnerTransactionModel
        .find(filter)
        .populate("partnerId", "name email phoneNumber userId")
        .populate("orderId", "orderId status orderTotal")
        .populate("bookingId", "bookingStatus finalPayableAmount")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      partnerTransactionModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Wallet transactions fetched successfully",
      pagination: {
        totalRecords: total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
      },
      data: transactions,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===================== 4) All Partner Wallets ===================== ||

exports.getAllPartnerWallets = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [wallets, total] = await Promise.all([
      partnerWalletModel
        .find()
        .populate("partnerId", "name email phoneNumber userId")
        .sort({ totalEarnings: -1 })
        .skip(skip)
        .limit(Number(limit)),
      partnerWalletModel.countDocuments(),
    ]);

    // Calculate aggregate stats
    const aggregation = await partnerWalletModel.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$balance" },
          totalEarnings: { $sum: "$totalEarnings" },
          totalWithdrawn: { $sum: "$totalWithdrawn" },
          totalCommissionPaid: { $sum: "$totalCommissionPaid" },
        },
      },
    ]);

    const summary = aggregation[0] || {
      totalBalance: 0,
      totalEarnings: 0,
      totalWithdrawn: 0,
      totalCommissionPaid: 0,
    };

    return res.status(200).json({
      success: true,
      message: "All partner wallets fetched successfully",
      summary,
      pagination: {
        totalRecords: total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
      },
      data: wallets,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===================== 5) All Withdraw Requests ===================== ||

exports.getAllWithdrawRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (status) filter.status = status;

    const [requests, total] = await Promise.all([
      withdrawRequestModel
        .find(filter)
        .populate("partnerId", "name email phoneNumber userId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      withdrawRequestModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Withdraw requests fetched successfully",
      pagination: {
        totalRecords: total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
      },
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===================== 6) Process Withdraw Request ===================== ||

exports.processWithdrawRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!["APPROVED", "REJECTED", "COMPLETED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be APPROVED, REJECTED, or COMPLETED",
      });
    }

    const withdrawRequest = await withdrawRequestModel.findById(id);

    if (!withdrawRequest) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found",
      });
    }

    if (["COMPLETED", "REJECTED"].includes(withdrawRequest.status)) {
      return res.status(400).json({
        success: false,
        message: `Request already ${withdrawRequest.status.toLowerCase()}`,
      });
    }

    // If REJECTED → credit back to wallet
    if (status === "REJECTED") {
      const wallet = await partnerWalletModel.findOne({
        partnerId: withdrawRequest.partnerId,
      });

      if (wallet) {
        wallet.balance += withdrawRequest.amount;
        await wallet.save();
      }

      // Create reversal transaction
      await partnerTransactionModel.create({
        partnerId: withdrawRequest.partnerId,
        orderType: "ECOMMERCE",
        amount: withdrawRequest.amount,
        commissionPercent: 0,
        commissionAmount: 0,
        netAmount: withdrawRequest.amount,
        transactionType: "WITHDRAWAL_REVERSAL",
        status: "COMPLETED",
        description: `Withdrawal of ₹${withdrawRequest.amount} rejected — amount refunded to wallet`,
      });

      // Update the pending WITHDRAWAL transaction to FAILED
      await partnerTransactionModel.findOneAndUpdate(
        {
          partnerId: withdrawRequest.partnerId,
          transactionType: "WITHDRAWAL",
          status: "PENDING",
          netAmount: withdrawRequest.amount,
        },
        { status: "FAILED" }
      );
    }

    // If APPROVED or COMPLETED → update wallet totalWithdrawn
    if (status === "APPROVED" || status === "COMPLETED") {
      await partnerWalletModel.findOneAndUpdate(
        { partnerId: withdrawRequest.partnerId },
        { $inc: { totalWithdrawn: withdrawRequest.amount } }
      );

      // Mark the WITHDRAWAL transaction as COMPLETED
      await partnerTransactionModel.findOneAndUpdate(
        {
          partnerId: withdrawRequest.partnerId,
          transactionType: "WITHDRAWAL",
          status: "PENDING",
          netAmount: withdrawRequest.amount,
        },
        {
          status: "COMPLETED",
          description: `Withdrawal of ₹${withdrawRequest.amount} ${status.toLowerCase()}`,
        }
      );
    }

    // Update withdraw request
    withdrawRequest.status = status;
    withdrawRequest.adminNote = adminNote || "";
    withdrawRequest.processedAt = new Date();
    await withdrawRequest.save();

    return res.status(200).json({
      success: true,
      message: `Withdrawal request ${status.toLowerCase()} successfully`,
      data: withdrawRequest,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
