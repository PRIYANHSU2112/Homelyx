

const orderModel = require("../../models/ecommerce/orderModel");
const CartModel = require("../../models/ecommerce/CartModel");
const productModel = require("../../models/ecommerce/productModel");
const addressModel = require("../../models/ecommerce/addressModel");
const walletModel = require("../../models/walletModel")
const { invoice } = require("../../midellwares/invoice");
const {cancleInvoice}= require("../../midellwares/cancleInvoice");
const { OrderEcommerce } = require("../../helper/status");
const crypto = require("crypto");
const { razorpay } = require("../../../config/razorpay");
const couponUsed = require("../../models/isUsedCouponModel");
const couponModel = require("../../models/couponModel");
const {
  sendNotificationAdminAndSubAdminAfterOrderCreate,
  sendNotificationAdminAndSubAdmin,
  sendNotificationUserOnStatusUpdate,
  sendNotificationToUserByPartner,
} = require("../notificationController");
const shippingModel = require("../../models/ecommerce/shippmentCharges");
const {
  sendMailOTP,
  sendOtpFunction,
} = require("../../midellwares/nodemailer");
const { local } = require("../../helper/shipping");
const transactionModel = require("../../models/ecommerce/transactionModel");
const { updateVariantStockAndSold } = require("../../helper/productVariantStock");
const mongoose = require("mongoose");

const dotenv = require("dotenv");
const { features } = require("process");
dotenv.config();


function checkStatusConsistency(array1, key) {
  if (array1.length === 0) {
    return false;
  }
  const firstStatus = array1[0][key];
  for (let i = 1; i < array1.length; i++) {
    if (array1[i][key] !== firstStatus) {
      return false;
    }
  }
  return true;
}
function changeValueByKey(array1, key, index, newValue, value) {
  if (checkStatusConsistency(array1, key)) {
    for (let i = 0; i < array1.length; i++) {
      // console.log(newValue);
      array1[i][key] = newValue;
      array1[i][index] =
        newValue === "PENDING"
          ? 1
          : newValue === "ORDERED"
            ? 2
            : newValue === "ACCEPTED"
              ? 3
              : newValue === "SHIPPED"
                ? 4
                : newValue === "OUT_OF_DELIVERY"
                  ? 5
                  : newValue === "DELIVERED"
                    ? 6
                    : newValue === "RETURN_REQUEST"
                      ? 7
                      : newValue === "RETURN_REQUEST_APPROVED"
                        ? 8
                        : newValue === "CANCELLED"
                          ? 10
                          : 9;
      value = newValue;
    }
  }
  // if (checkStatusConsistency(array1, key) && newValue == "RETURNED") {
  //   array1 = array1;
  //   value = "RETURNED";
  // }
  if (!checkStatusConsistency(array1, key)) {
    for (let i = 0; i < array1.length; i++) {
      array1[i][index] =
        array1[i].status === "PENDING"
          ? 1
          : array1[i].status === "ORDERED"
            ? 2
            : array1[i].status === "ACCEPTED"
              ? 3
              : array1[i].status === "SHIPPED"
                ? 4
                : array1[i].status === "OUT_OF_DELIVERY"
                  ? 5
                  : array1[i].status === "DELIVERED"
                    ? 6
                    : array1[i].status === "RETURN_REQUEST"
                      ? 7
                      : array1[i].status === "RETURN_REQUEST_APPROVED"
                        ? 8
                        : array1[i].status === "CANCELLED"
                          ? 10
                          : 9;
      value = "MULTI_STATUS";
    }
  }
  return value;
}

// ========================== Get Id =================================== ||

exports.getOrderId = async (req, res, next, id) => {
  try {
    let Order = await orderModel.findById(id).populate({
      path: "product.productId",
    });
    if (!Order) {
      return res.status(404).json({
        success: false,
        message: "Order Not Found",
      });
    } else {
      (req.Order = Order), next();
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};



// ======================== Create Order ======================== ||
exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      customerId,
      addressId,
      // categoryId,
      paymentMethod,
    } = req.body;

    if (!customerId) {
      return res.status(400).json({ success: false, message: "customerId required" });
    }

    if (!addressId) {
      return res.status(400).json({ success: false, message: "addressId required" });
    }

    if (!["COD", "ONLINE", "WALLET"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "paymentMethod must be COD or ONLINE pr WALLET",
      });
    }

    if (!req.bill || req.bill.items.length === 0) {
      await session.endSession();
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const {
      orderTotal,
      taxAmount,
      netAmount,
      couponCode,
      couponId,
      couponeDiscount,
      totalOfferDiscount,
      items,
    } = req.bill;


    // console.log(req.bill);
    const paymentSessionId = crypto.randomUUID();

    const address = await addressModel.findById(addressId)
      .lean();
    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Invalid address",
      });
    }

    // console.log(paymentMethod)
    if (paymentMethod === "WALLET") {
      const wallet = await walletModel.findOne({ customerId }).session(session);

      if (!wallet || wallet.balance < orderTotal) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }
      wallet.balance -= netAmount;
      await wallet.save({ session });
    }

      const order = await orderModel.create([{
      customerId,
      orderTotal,
      taxAmount,
      netAmount,
      couponeCode: couponCode,
      couponeDiscount,
      totalOfferDiscount,
      address,
      product: items,
      status: paymentMethod === "COD" || paymentMethod === "WALLET" ? "PENDING" : "PENDING",  // orderd ke jagha pending kiya hai coz payment verification is pending
      paymentMethod,
      paymentStatus: paymentMethod === "WALLET" ? "PAID" : "UNPAID",
      paymentSessionId
    }], { session });
    // console.log(order[0]._id.toString());

    // Only create coupon usage if couponId exists
    if (couponId) {
      const usedCoupon = await couponUsed.insertMany([{
        couponId: couponId,
        userId: customerId,
        couponCode: couponCode
      }], { session })
      // console.log(usedCoupon);

      await couponModel.updateOne({
        _id: couponId,
        couponQuantity: { $gt: 0 }
      }, { $inc: { couponQuantity: -1 } }, { session });
    }

    let razorpayOrder = null;

    if (paymentMethod === "ONLINE") {
      razorpayOrder = await razorpay.orders.create({
        amount: orderTotal * 100,
        currency: "INR",
        receipt: `order_${order[0]._id}`
      })
    }

    // Create Transation

    const transaction = await transactionModel.create([{
      customerId: customerId,
      orderId: order[0]._id,
      razorpayOrderId: razorpayOrder?.id || null,
      amount: orderTotal,
      paymentMethod,
      status: "CREATED",
      walletType: paymentMethod === "WALLET" ? "DEBIT" : null,
      walletPurpose: paymentMethod === "WALLET" ? "ORDER_PAYMENT" : null,
      paymentSessionId
    }], { session })


    if (paymentMethod === "COD" || paymentMethod === "WALLET") {

      for (const item of items) {

        const updatedProduct = await productModel.findOneAndUpdate(
          {
            _id: item.productId,
            "variants._id": item.variantId,
            "variants.stock": { $gte: item.quantity } // safety check
          },
          {
            $inc: {
              // VARIANT LEVEL
              "variants.$.stock": -item.quantity,
              "variants.$.sold": item.quantity,
              // product level
              sold: item.quantity
            }
          },
          {
            session,
            new: true
          }
        );

        if (!updatedProduct) {
          throw new Error("STOCK_UNAVAILABLE");
        }
      }
      //  let code = await invoice(order[0]);
      await orderModel.findByIdAndUpdate(
        order[0]._id, 
        { 
        transactionId:transaction[0]._id , },
        {new:true,session}
        ); 
      await CartModel.deleteOne({ customerId });
    }

    await session.commitTransaction();
    session.endSession();

    if (paymentMethod === "COD" || paymentMethod === "WALLET") {
      await sendNotificationToUserByPartner(order, order[0].status, "ADMIN");
    }

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      data: order,
      razorpayOrderId: razorpayOrder?.id || null,
      key: paymentMethod === "ONLINE" ? process.env.RAZORPAY_KEY_ID : null
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({
      success: false,
      message: error.message,
    });
    console.log(error.stack);
  }
};


exports.verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();

  
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;
    // console.log(req.body);
    // console.log(razorpay_signature)
    const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');


    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature"
      })
    }

    const transaction = await transactionModel.findOne({ orderId: orderId, razorpayOrderId: razorpay_order_id })

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      })
    }

    const order = await orderModel.findById(orderId).populate("customerId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      })
    }
    // console.log(order)
    //     console.log("paymentStatus type:", typeof order.paymentStatus);
    // console.log("schema paymentStatus:", order.schema.path("paymentStatus"));

    if (order.paymentStatus === "PAID" && transaction.status === "SUCCESS") {
      return res.status(200).json({ success: true, message: "Payment already verified" });
    }


    transaction.razorpayPaymentId ??= razorpay_payment_id;
    transaction.razorpaySignature ??= razorpay_signature;
    transaction.status = "SUCCESS";
    await transaction.save({ session })
    

    order.paymentStatus = "PAID";
    // order.status = "ORDERED";
    order.status = "PENDING";
    order.transactionId = transaction._id;
    order.transactionRef = razorpay_order_id;
    await order.save({ session })
   
     await CartModel.deleteOne({ customerId: order.customerId });

    //  STOCK UPDATE + REFUND SAFETY

    // console.log(order.product)


    session.startTransaction();

    try {
      for (const item of order.product) {
        const updatedProduct = await productModel.findOneAndUpdate(
          { _id: item.productId },
          {
            $inc: {
              "variants.$[v].stock": -item.quantity,
              "variants.$[v].sold": item.quantity,
              sold: item.quantity,
            },
          },
          {
            arrayFilters: [
              {
                "v._id": new mongoose.Types.ObjectId(item.variantId),
                "v.stock": { $gte: item.quantity },
              },
            ],
            session,
            new: true,
          }
        );

        if (!updatedProduct) {
          throw new Error("STOCK_UNAVAILABLE");
        }
      }

      //  Commit stock updates
      await session.commitTransaction();
      session.endSession();

      await sendNotificationToUserByPartner(order, order.status, "ADMIN");

      return res.status(200).json({
        success: true,
        message: "Payment verified & stock updated successfully",
      });

    } catch (error) {

      await session.abortTransaction();
      session.endSession();

      //  Refund only if payment was done
      if (transaction.status === "SUCCESS") {
        await razorpay.payments.refund(razorpay_payment_id, {
          amount: transaction.amount * 100
        });

        transaction.status = "REFUNDED";
        await transaction.save();
      }

      order.paymentStatus = "FAILED";
      order.paymentFailedReason = "Stock unavailable – refund issued";
      await order.save();

      res.status(400).json({
        success: false,
        message: `Stock unavailable – refund issued + ${error.stack}`
      });
      // console.error(error.stack)

    }

      // const  code = await invoice(order);
      // order.invoice = `HomelyxOrder/${code}.pdf`;
  
      // await orderModel.save();

      // await sendNotificationToUserByPartner(order, order.status, "ADMIN");

      // return res.status(200).json({
      //   success: true,
      //   message: "Payment verified & stock updated successfully",
      // });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
}


// ================= updateSingleStatus ===============//
exports.updateSingleStatus = async (req, res) => {
  try {
    //     console.log("REQ.ORDER =>", req.Order);
    // console.log("REQ.BODY =>", req.body);

    let status = req.body.status;

    if (!status) {
      return res
        .status(400)
        .json({ success: false, message: "Status Is Required..." });
    }

    if (!Object.values(OrderEcommerce).includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "(PENDING || ORDERED || MULTI_STATUS || SHIPPED || RETURN_REQUEST_APPROVED || DELIVERED || CANCELLED || RETURN_REQUEST || OUT_OF_DELIVERY || RETURNED) This Is Valied Status",
      });
    }
    if (!req.query.productId) {
      return res.status(400).json({
        success: false,
        message: "productId Is Required...",
      });
    }
    let statusUpdate;
    if (status == "RETURNED") {
      if (!req.query.productId) {
        return res.status(400).json({
          success: false,
          message: "productId Is Required",
        });
      }
      statusUpdate = await orderModel.findOneAndUpdate(
        {
          _id: req.Order._id,
          "product.productId": req.query.productId,
        },
        { $set: { "product.$.status": req.body.status } },
        { new: true }
      );

      let a = await productModel.findById({
        _id: req.query.productId,
      });

      let data = statusUpdate.product.find((o) => {
        return o.productId == req.query.productId;
      });
      await productModel.findByIdAndUpdate(
        { _id: req.query.productId },
        {
          $set: {
            stock: a.stock + data.quantity,
            sold: a.sold - data.quantity,
          },
        },
        { new: true }
      );
    } else {
      let find = await orderModel.findOne({
        _id: req.Order._id,
        "product.productId": req.query.productId,
      });
      // console.log("find" + find);
      let check = true;
      // for (let i = 0; i < find.product.length; i++) {
      //   if (
      //     find.product[i].productId == req.query.productId &&
      //     find.product[i].status == "RETURN_REQUEST"
      //   ) {
      //     check = true;
      //   }
      // }
      // console.log(req.Order.product)      
      if (check && req.body.status == "CANCELLED") {
        await updateVariantStockAndSold(
          req.Order.product,
          +1, 
          -1  
        );
        statusUpdate = await orderModel.findOneAndUpdate(
          {
            _id: req.Order._id,
            "product.productId": req.query.productId,
          },
          { $set: { "product.$.status": "CANCELLED" } },
          { new: true }
        );
      } else {
        statusUpdate = await orderModel.findOneAndUpdate(
          {
            _id: req.Order._id,
            "product.productId": req.query.productId,
          },
          { $set: { "product.$.status": req.body.status } },
          { new: true }
        );
      }
    }
    let array1 = statusUpdate.product;
    // console.log(array1)
    let value = "SINGLE";
    value = changeValueByKey(
      array1,
      "status",
      "indexStatus",
      req.body.status,
      value
    );
    //if (value == "RETURNED") {
    // array1 = [];
    //}
    statusUpdate = await orderModel.findOneAndUpdate(
      {
        _id: req.Order._id,
      },
      { $set: { product: array1, status: value } },
      { new: true }
    );

    await sendNotificationUserOnStatusUpdate(statusUpdate, status);
    return res.status(200).json({
      success: true,
      message: "Status Is Update Successfully...",
      // data: statusUpdate,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================== Update All status ===================== ||

exports.updateAllProductStatus = async (req, res) => {
  try {
    const status = req.body.status;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status Is Required",
      });
    }

    if (!Object.values(OrderEcommerce).includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // console.log("order " + req.Order.product)

    // const updatedProducts = req.Order.product.map(p => ({
    //   ...p,
    //   status: status,
    // }));


    if (
      status === OrderEcommerce.CANCELLED && req.Order.status !== OrderEcommerce.CANCELLED
    ) {
      await updateVariantStockAndSold(
        req.Order.product,
        +1, // stock increase
        -1  // sold decrease
      );
    }


    const statusUpdate = await orderModel.findByIdAndUpdate(
      req.Order._id,
      {
        $set: {
          status: status,
          "product.$[].status": status,
        },
      },
      { new: true }
    ).populate("customerId");

    if(status === OrderEcommerce.DELIVERED){
      const code = await invoice(req.Order);
      await orderModel.findByIdAndUpdate(
      req.Order._id,
      {
        $set: {
          invoice: `home-lyx/${code}.pdf`,
        },
      },
      { new: true }
    )
    }

    sendNotificationUserOnStatusUpdate(statusUpdate, status);

    return res.status(200).json({
      success: true,
      message: "Status Updated Successfully",
      data: statusUpdate,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= updateTransitionId ===================
exports.updateTransitionId = async (req, res) => {
  try {
    if (!req.body.transactionId) {
      return res.status(400).json({
        success: false,
        message: "transactionId Is Required",
      });
    }
    let array1 = req.Order.product;
    let value = "SINGLE";
    value = changeValueByKey(
      array1,
      "status",
      "indexStatus",
      OrderEcommerce.ORDERED,
      value
    );
    // for (let i = 0; i < array1.length; i++) {
    //   console.log(array1[i].productId);
    //   let a = await productModel.findById({ _id: array1[i].productId._id });
    //   await productModel.findByIdAndUpdate(
    //     { _id: array1[i].productId._id },
    //     {
    //       $set: {
    //         stock: a.stock - Cart[i].quantity,
    //         sold: a.sold + Cart[i].quantity,
    //       },
    //     },
    //     { new: true }
    //   );
    // }

    let code = await invoice(req.Order);
    const updtetrans = await orderModel.findOneAndUpdate(
      { _id: req.Order._id },
      {
        $set: {
          transactionId: req.body.transactionId,
          product: array1,
          status: value,
          invoice: `HomeService/${code}.pdf`,
          paymentStatus: "PAID",
        },
      },
      { new: true }
    );

    return res.status(200).send({
      success: true,
      message: "TransactionId Update Successfully",
      data: updtetrans,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// ======================  getOrderByCustomerId ===================== ||
exports.getOrderByCustomerId = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "" ;
    const skip = (page - 1) * limit;

    const baseQuery = { customerId: req.User._id };

    const result = await orderModel.aggregate([
      // Match customer orders
      { $match: baseQuery },

      // Join products and customer
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "ecommerceproductmodels",
          localField: "product.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "usermodels",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },

      // Search filter (if provided)
      ...(search ? [{
        $match: {
          $or: [
            { status: { $regex: search, $options: "i" } },
            { orderId: { $regex: search, $options: "i" } },
            { "productDetails.title": { $regex: search, $options: "i" } },
            { "productDetails.brandName": { $regex: search, $options: "i" } },
            { "customer.name": { $regex: search, $options: "i" } },
            { "customer.email": { $regex: search, $options: "i" } },
          ],
        },
      }] : []),

      // Group back products
      {
        $group: {
          _id: "$_id",
          orderTotal: { $first: "$orderTotal" },
          status: { $first: "$status" },
          createdAt: { $first: "$createdAt" },
          address: { $first: "$address" },
          taxAmount: { $first: "$taxAmount" },
          paymentStatus: { $first: "$paymentStatus" },
          netAmount: { $first: "$netAmount" },
          transactionId: { $first: "$transactionId" },
          transactionRef: { $first: "$transactionRef" },
          cancleBy: { $first: "$cancleBy" },
          reason: { $first: "$reason" },
          customer: { $first: "$customer" },
          products: {
            $push: {
              productId: "$product.productId",
              variantId: "$product.variantId",
              quantity: "$product.quantity",
              price: "$product.price",
              title: "$productDetails.title",
              brandName: "$productDetails.brandName",
              thumnail: "$productDetails.thumnail",
              features: "$productDetails.features",
              size: {
                $let: {
                  vars: {
                    selectedVariant: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$productDetails.variants",
                            as: "v",
                            cond: { $eq: ["$$v._id", "$product.variantId"] }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: "$$selectedVariant.size"
                }
              }
            }
          }
        }
      },

      {
        $addFields: {
          productCount: { $size: "$products" }, // Number of unique products
        },
      },
      // Sort
      { $sort: { createdAt: -1 } },

      // Facet for count + pagination
      {
        $facet: {
          totalOrders: [{ $count: "count" }],
          orders: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                orderId: 1,
                orderTotal: 1,
                status: 1,
                createdAt: 1,
                taxAmount: 1,
                paymentStatus:1,
                netAmount:1,
                transactionId:1,
                transactionRef:1,
                cancleBy:1,
                reason:1,
                products: 1,
                productCount: 1,
                address: 1,
                customer: {
                  _id: 1,
                  name: 1,
                  email: 1,
                  fullName:1,
                  phoneNumber:1,
                  userType:1,
                  permissions:1,
                  gender:1,
                  image:1,
                },
              },
            },
          ],
        },
      },

      {
        $project: {
          totalOrders: {
            $ifNull: [{ $arrayElemAt: ["$totalOrders.count", 0] }, 0],
          },
          orders: 1,
        },
      },
    ]);

    const totalOrders = result[0]?.totalOrders || 0;
    const orders = result[0]?.orders || [];
    const totalPages = Math.ceil(totalOrders / limit);

    return res.status(200).send({
      success: true,
      message: "Orders fetched successfully",
      data: orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// ============== getByOrderId ==================
exports.getByOrderId = async (req, res) => {
  try {
    let orderDetails = await orderModel
      .findById(req.Order._id)
      .select(
        "-_id orderTotal taxAmount totalOfferDiscount status netAmount  workingOtp completedOtp couponeCode couponeDiscount memberDiscount memberDiscountPercent"
      );
    let order = await orderModel
      .findById(req.Order._id)
      .select(
        "-orderTotal -taxAmount -totalOfferDiscount -status -netAmount  -workingOtp -completedOtp -couponeCode -couponeDiscount -memberDiscount -memberDiscountPercent"
      )
      .populate({
        path: "product.productId",
      })
      .populate("customerId");
    order._doc.orderDetails = orderDetails;
    return res.status(200).send({
      success: true,
      message: "Order Fatch Successfully...",
      data: order,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// ================= Cancle =================
exports.cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    console.log("REQ.ORDER =>");
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required",
      });
    }

    const blockedStatuses = [
      OrderEcommerce.SHIPPED,
      OrderEcommerce.OUT_OF_DELIVERY,
      OrderEcommerce.DELIVERED,
      OrderEcommerce.CANCELLED,
    ];

    if (blockedStatuses.includes(req.Order.status)) {
      await session.abortTransaction();
         session.endSession();

      return res.status(400).json({
        
        success: false,
        message: `Order cannot be cancelled as it is already ${req.Order.status}`
      });
    }

    let array1 = req.Order.product;
    let value = "SINGLE";
    value = changeValueByKey(
      array1,
      "status",
      "indexStatus",
      OrderEcommerce.CANCELLED,
      value
    );
    if (value == "CANCELLED") {
      for (let i = 0; i < req.Order.product.length; i++) {
        let a = await productModel.findById({
          _id: req.Order.product[i].productId._id,
        }).session(session);
        await productModel.findByIdAndUpdate(
          { _id: req.Order.product[i].productId._id },
          {
            $set: {
              stock: a.stock + req.Order.product[i].quantity,
              sold: a.sold - req.Order.product[i].quantity,
            },
          },
          { new: true, session }
        );
      }
    }
    let cancelData = await orderModel.findOneAndUpdate(
      { _id: req.Order._id },
      {
        $set: {
          status: OrderEcommerce.CANCELLED,
          cancleBy: "CUSTOMER",
          product: array1,
          statu: value,
          reason: reason,
        },
      },
      { new: true, session  }
    );
    console.log("CANCLE DATA =>", cancelData);

    if (
      ["WALLET", "ONLINE"].includes(cancelData.paymentMethod) &&
      cancelData.paymentStatus === "PAID"
    ) {
      const refundAmount = cancelData.orderTotal;

      // 1️⃣ Wallet creditr
      await walletModel.findOneAndUpdate(
        { customerId: cancelData.customerId },
        { $inc: { balance: refundAmount } },
        { upsert: true, session }
      );

      // 2️⃣ Transaction entry
      await transactionModel.create(
        [
          {
            orderId: cancelData._id,
            customerId: cancelData.customerId,
            amount: refundAmount,
            paymentMethod: "WALLET",
            walletType: "CREDIT",
            walletPurpose: "REFUND",
            status: "REFUNDED",
          },
        ],
        { session }
      );
      //  console.log("CALALLA"+cancelData);
      // 3️⃣ Update order payment status
      const code = await cancleInvoice(cancelData);
      // console.log("code =>", code);
     cancelData= await orderModel.findByIdAndUpdate(
        cancelData._id,
        {
          $set: { paymentStatus: "REFUNDED" , invoice: `home-lyx/${code}.pdf`},
        },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();
    // sendNotificationAdminAndSubAdmin(cancelData, OrderEcommerce.CANCELLED);
    return res.status(200).send({
      success: true,
      message: "Order Cancelled Successfully and refund initiated in your wallet",
      // data: cancelData,
    });
  } catch (error) {
      await session.abortTransaction();
  session.endSession();
    console.error("Error cancelling order:", error.stack);
    return res.status(500).send({ success: false, message: error.message });
  }
};

// ================= return RequestOrder =================
exports.returnRequestOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const { productId, variantId } = req.query;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "reason is required",
      });
    }

    if (!productId || !variantId) {
      return res.status(400).json({
        success: false,
        message: "productId and variantId are required",
      });
    }

    const order = req.Order;
    let targetItem = null;

    for (const item of order.product) {
      if (
        item.productId._id.toString() === productId.toString() &&
        item.variantId.toString() === variantId.toString()
      ) {
        targetItem = item;
        break;
      }
    }

    if (!targetItem) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found in order",
      });
    }

    if (["RETURN_REQUEST", "RETURNED"].includes(targetItem.status)) {
      return res.status(400).json({
        success: false,
        message: "Return already initiated for this item",
      });
    }

    if (targetItem.returnInDays === 0) {
      return res.status(400).json({
        success: false,
        message: "Return not allowed for this product",
      });
    }

    const deliveredDate = new Date(order.deliveredDate);
    deliveredDate.setHours(23, 59, 59, 999);
    deliveredDate.setDate(
      deliveredDate.getDate() + targetItem.returnInDays - 1
    );

    if (new Date() > deliveredDate) {
      return res.status(400).json({
        success: false,
        message: "Return window expired",
      });
    }

    const updatedOrder = await orderModel.findOneAndUpdate(
      { _id: order._id },
      {
        $set: {
          "product.$[item].status": "RETURN_REQUEST",
          reason,
        },
      },
      {
        arrayFilters: [
          {
            "item.productId": productId,
            "item.variantId": variantId,
          },
        ],
        new: true,
      }
    );

    const statuses = updatedOrder.product.map(p => p.status);

    let orderStatus = "MULTI_STATUS";

    if (statuses.every(s => s === "RETURN_REQUEST")) {
      orderStatus = "RETURN_REQUEST";
    }

    // if (statuses.every(s => s === "RETURN_REQUEST_APPROVED")) {
    //   orderStatus = "RETURN_REQUEST_APPROVED";
    // }

    if (statuses.every(s => s === "RETURNED")) {
      orderStatus = "RETURNED";
    }
    //  RETURN_REQUEST_APPROVED
    updatedOrder.status = orderStatus;
    await updatedOrder.save();

    return res.status(200).json({
      success: true,
      message: "Return request submitted successfully",
      data: updatedOrder,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.filterOrderByDate = async (req, res) => {
  try {
    const { status, filter, paymentMethod } = req.query;
    let obj = {};
    let obj2 = {};
    let turnOver = 0;
    let pendingCount = 0;
    let outOfDeliveryCount = 0;
    let orderedCount = 0;
    let deliveredCount = 0;
    let returnRequestCount = 0;
    let returnedCount = 0;
    let returnRequestApprovedCount = 0;
    let shippedCount = 0;
    let multiStatusCount = 0;
    let cancelCount = 0;
    if (req.filterQuery) {
      obj.createdAt = req.filterQuery;
    }
    if (status) {
      if (!Object.values(OrderEcommerce).includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "(PENDING || ORDERED || MULTI_STATUS || SHIPPED || RETURN_REQUEST_APPROVED || DELIVERED || CANCELLED || RETURN_REQUEST || OUT_OF_DELIVERY || RETURNED) This Is Valied Status",
        });
      } else {
        obj.status = status;
      }
    }
    if (paymentMethod) {
      obj.paymentMethod = paymentMethod;
    }
    if (req.query.price) {
      // console.log(req.query.price);
      if (
        req.query.price !== "low_to_high" &&
        req.query.price !== "high_to_low"
      ) {
        return res.status(400).json({
          success: false,
          message: "'low_to_high', 'high_to_low' are the valid price options.",
        });
      } else {
        if (req.query.price === "low_to_high") {
          obj2.orderTotal = 1;
        } else if (req.query.price === "high_to_low") {
          obj2.orderTotal = -1;
        }
      }
    }
    obj2.createdAt = -1;
    let getData = await orderModel.find(obj).sort(obj2).populate({
      path: "customerId",
      select: "fullName",
    })
      .populate({
        path: "product.productId",
        select: "title",
      })
    let datas = "";
    function applyFilters(getData) {
      const search = req.query.search;
      let filteredData = getData.filter((e) => {
        let check = false;
        if (search && search.length == 24) {
          if (e?._id == search) {
            check = true;
            return e?._id == search;
          }
        } else if (!check) {
          return (
            !search || new RegExp(search, "i").test(e.customerId?.fullName)
          );
        }
      });

      filteredData.forEach((f) => {
        if (f.status === "PENDING") {
          pendingCount++;
        } else if (f.status === "ORDERED") {
          orderedCount++;
        } else if (f.status === "OUT_OF_DELIVERY") {
          outOfDeliveryCount++;
        } else if (f.status === "DELIVERED") {
          deliveredCount++;
        } else if (f.status === "RETURN_REQUEST") {
          returnRequestCount++;
        } else if (f.status === "RETURNED") {
          returnedCount++;
        } else if (f.status === "CANCELLED") {
          cancelCount++;
        } else if (f.status === "RETURN_REQUEST_APPROVED") {
          returnRequestApprovedCount++;
        } else if (f.status === "SHIPPED") {
          shippedCount++;
        } else if (f.status === "MULTI_STATUS") {
          multiStatusCount++;
        }

        if (f.orderTotal) {
          turnOver += f.orderTotal;
        }
      });

      return {
        filteredData,
        pendingCount,
        outOfDeliveryCount,
        orderedCount,
        deliveredCount,
        returnRequestCount,
        returnedCount,
        returnRequestApprovedCount,
        shippedCount,
        multiStatusCount,
        cancelCount,
        turnOver,
      };
    }

    const result = applyFilters(getData);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const length = result.filteredData.length;
    const totalPages = Math.ceil(length / limit);
    const data = result.filteredData.slice(startIndex, endIndex);
    return res.status(200).json({
      success: true,
      message: "Order Is Filter Successfully...",
      data: datas ? datas : data,
      stats: {
        turnOver: turnOver,
        pendingCount: pendingCount,
        outOfDeliveryCount: outOfDeliveryCount,
        orderedCount: orderedCount,
        deliveredCount: deliveredCount,
        returnRequestCount: returnRequestCount,
        returnedCount: returnedCount,
        returnRequestApprovedCount: returnRequestApprovedCount,
        shippedCount: shippedCount,
        multiStatusCount: multiStatusCount,
        cancelCount: cancelCount,
      },
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalRecords: length,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
