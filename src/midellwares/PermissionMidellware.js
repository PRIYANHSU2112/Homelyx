const { userPermissions } = require("../helper/userPermission");
const { userType } = require("../helper/userType");


// ================ isCategory ======================= 
exports.isCategory = (req, res, next) => {
  try {
    if (
      (req.Admin.userType.includes(userType.admin) ===
        Object.values(userType).includes(userType.admin) ||
        req.Admin.userType.includes(userType.subAdmin) ===
          Object.values(userType).includes(userType.subAdmin) ||
        req.Admin.userType.includes(userType.superAdmin) ===
          Object.values(userType).includes(userType.superAdmin)) &&
      (req.Admin.permissions.includes(userPermissions.category) ||
        req.Admin.permissions.includes(userPermissions.all))
    ) {
      next();
    } else {
      return res.status(404).json({
        success: false,
        message: "YOU ARE NOT AN SUPER-ADMIN/ADMIN/SUB-ADMIN/CUSTOMER/PARTNER",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================ isOrder =======================
exports.isOrder = (req, res, next) => {
  try {
    if (
      (req.Admin.userType.includes(userType.admin) ===
      Object.values(userType).includes(userType.admin) ||
      req.Admin.userType.includes(userType.subAdmin) ===
        Object.values(userType).includes(userType.subAdmin) ||
      req.Admin.userType.includes(userType.superAdmin) ===
        Object.values(userType).includes(userType.superAdmin)) &&
    (req.Admin.permissions.includes(userPermissions.category) ||
      req.Admin.permissions.includes(userPermissions.all))
    ) {
      next();
    } else {
      return res.status(404).json({
        success: false,
        message: "YOU ARE NOT AN SUPER-ADMIN/ADMIN/SUB-ADMIN/CUSTOMER/PARTNER",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================ isProduct ======================= 
exports.isProduct = (req, res, next) => {
  try {
    if (
      (req.Admin.userType.includes(userType.admin) ===
      Object.values(userType).includes(userType.admin) ||
      req.Admin.userType.includes(userType.subAdmin) ===
        Object.values(userType).includes(userType.subAdmin) ||
      req.Admin.userType.includes(userType.superAdmin) ===
        Object.values(userType).includes(userType.superAdmin)) &&
    (req.Admin.permissions.includes(userPermissions.category) ||
      req.Admin.permissions.includes(userPermissions.all))
    ) {
      next();
    } else {
      return res.status(404).json({
        success: false,
        message: "YOU ARE NOT AN SUPER-ADMIN/ADMIN/SUB-ADMIN/CUSTOMER/PARTNER",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================ isCity ======================= 
exports.isCity = (req, res, next) => {
    try {
      if (
        (req.Admin.userType.includes(userType.admin) ===
        Object.values(userType).includes(userType.admin) ||
        req.Admin.userType.includes(userType.subAdmin) ===
          Object.values(userType).includes(userType.subAdmin) ||
        req.Admin.userType.includes(userType.superAdmin) ===
          Object.values(userType).includes(userType.superAdmin)) &&
      (req.Admin.permissions.includes(userPermissions.category) ||
        req.Admin.permissions.includes(userPermissions.all))
      ) {
        next();
      } else {
        return res.status(404).json({
          success: false,
          message: "YOU ARE NOT AN SUPER-ADMIN/ADMIN/SUB-ADMIN/CUSTOMER/PARTNER",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
};

// ================ isCoupon ======================= 
exports.isCoupon = (req, res, next) => {
  try {
    if (
      (req.Admin.userType.includes(userType.admin) ===
      Object.values(userType).includes(userType.admin) ||
      req.Admin.userType.includes(userType.subAdmin) ===
        Object.values(userType).includes(userType.subAdmin) ||
      req.Admin.userType.includes(userType.superAdmin) ===
        Object.values(userType).includes(userType.superAdmin)) &&
    (req.Admin.permissions.includes(userPermissions.coupon) ||
      req.Admin.permissions.includes(userPermissions.all))
    ) {
      next();
    } else {
      return res.status(404).json({
        success: false,
        message: "YOU ARE NOT AN SUPER-ADMIN/ADMIN/SUB-ADMIN/CUSTOMER/PARTNER",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================ isMembership ======================= 
exports.isMembership = (req, res, next) => {
  try {
    if (
      (req.Admin.userType.includes(userType.admin) ===
      Object.values(userType).includes(userType.admin) ||
      req.Admin.userType.includes(userType.subAdmin) ===
        Object.values(userType).includes(userType.subAdmin) ||
      req.Admin.userType.includes(userType.superAdmin) ===
        Object.values(userType).includes(userType.superAdmin)) &&
    (req.Admin.permissions.includes(userPermissions.membership) ||
      req.Admin.permissions.includes(userPermissions.all))
    ) {
      next();
    } else {
      return res.status(404).json({
        success: false,
        message: "YOU ARE NOT AN SUPER-ADMIN/ADMIN/SUB-ADMIN/CUSTOMER/PARTNER",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================ isHomebanner ======================= 
exports.isHomebanner = (req, res, next) => {
  try {
    if (
      (req.Admin.userType.includes(userType.admin) ===
      Object.values(userType).includes(userType.admin) ||
      req.Admin.userType.includes(userType.subAdmin) ===
        Object.values(userType).includes(userType.subAdmin) ||
      req.Admin.userType.includes(userType.superAdmin) ===
        Object.values(userType).includes(userType.superAdmin)) &&
    (req.Admin.permissions.includes(userPermissions.homebanner) ||
      req.Admin.permissions.includes(userPermissions.all))
    ) {
      next();
    } else {
      return res.status(404).json({
        success: false,
        message: "YOU ARE NOT AN SUPER-ADMIN/ADMIN/SUB-ADMIN/CUSTOMER/PARTNER",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================ isHomeCategory ======================= 
exports.isHomeCategory = (req, res, next) => {
  try {
    if (
      (req.Admin.userType.includes(userType.admin) ===
      Object.values(userType).includes(userType.admin) ||
      req.Admin.userType.includes(userType.subAdmin) ===
        Object.values(userType).includes(userType.subAdmin) ||
      req.Admin.userType.includes(userType.superAdmin) ===
        Object.values(userType).includes(userType.superAdmin)) &&
    (req.Admin.permissions.includes(userPermissions.homeCategory) ||
      req.Admin.permissions.includes(userPermissions.all))
    ) {
      next();
    } else {
      return res.status(404).json({
        success: false,
        message: "YOU ARE NOT AN SUPER-ADMIN/ADMIN/SUB-ADMIN/CUSTOMER/PARTNER",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================ isAppBanner ======================= 
exports.isAppBanner = (req, res, next) => {
  try {
    if (
      (req.Admin.userType.includes(userType.admin) ===
      Object.values(userType).includes(userType.admin) ||
      req.Admin.userType.includes(userType.subAdmin) ===
        Object.values(userType).includes(userType.subAdmin) ||
      req.Admin.userType.includes(userType.superAdmin) ===
        Object.values(userType).includes(userType.superAdmin)) &&
    (req.Admin.permissions.includes(userPermissions.appBanner) ||
      req.Admin.permissions.includes(userPermissions.all))
    ) {
      next();
    } else {
      return res.status(404).json({
        success: false,
        message: "YOU ARE NOT AN SUPER-ADMIN/ADMIN/SUB-ADMIN/CUSTOMER/PARTNER",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// ================ isUser ======================= 
exports.isUser = (req, res, next) => {
  try {
    if (
      (req.Admin.userType.includes(userType.admin) ===
      Object.values(userType).includes(userType.admin) ||
      req.Admin.userType.includes(userType.subAdmin) ===
        Object.values(userType).includes(userType.subAdmin) ||
      req.Admin.userType.includes(userType.superAdmin) ===
        Object.values(userType).includes(userType.superAdmin)) &&
    (req.Admin.permissions.includes(userPermissions.users) ||
      req.Admin.permissions.includes(userPermissions.all))
    ) {
      next();
    } else {
      return res.status(404).json({
        success: false,
        message: "YOU ARE NOT AN SUPER-ADMIN/ADMIN/SUB-ADMIN/CUSTOMER/PARTNER",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================ isBrand ======================= 
exports.isBrand = (req, res, next) => {
  try {
    if (
      (req.Admin.userType.includes(userType.admin) ===
      Object.values(userType).includes(userType.admin) ||
      req.Admin.userType.includes(userType.subAdmin) ===
        Object.values(userType).includes(userType.subAdmin) ||
      req.Admin.userType.includes(userType.superAdmin) ===
        Object.values(userType).includes(userType.superAdmin)) &&
    (req.Admin.permissions.includes(userPermissions.brand) ||
      req.Admin.permissions.includes(userPermissions.all))
    ) {
      next();
    } else {
      return res.status(404).json({
        success: false,
        message: "YOU ARE NOT AN SUPER-ADMIN/ADMIN/SUB-ADMIN/CUSTOMER/PARTNER",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================ isHomeProduct ======================= 
exports.isHomeProduct = (req, res, next) => {
  try {
    if (
      (req.Admin.userType.includes(userType.admin) ===
      Object.values(userType).includes(userType.admin) ||
      req.Admin.userType.includes(userType.subAdmin) ===
        Object.values(userType).includes(userType.subAdmin) ||
      req.Admin.userType.includes(userType.superAdmin) ===
        Object.values(userType).includes(userType.superAdmin)) &&
    (req.Admin.permissions.includes(userPermissions.homeProduct) ||
      req.Admin.permissions.includes(userPermissions.all))
    ) {
      next();
    } else {
      return res.status(404).json({
        success: false,
        message: "YOU ARE NOT AN SUPER-ADMIN/ADMIN/SUB-ADMIN/CUSTOMER/PARTNER",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================ isCompany ======================= 
exports.isCompany = (req, res, next) => {
  try {
    if (
      (req.Admin.userType.includes(userType.admin) ===
      Object.values(userType).includes(userType.admin) ||
      req.Admin.userType.includes(userType.subAdmin) ===
        Object.values(userType).includes(userType.subAdmin) ||
      req.Admin.userType.includes(userType.superAdmin) ===
        Object.values(userType).includes(userType.superAdmin)) &&
    (req.Admin.permissions.includes(userPermissions.commpany) ||
      req.Admin.permissions.includes(userPermissions.all))
    ) {
      next();
    } else {
      return res.status(404).json({
        success: false,
        message: "YOU ARE NOT AN SUPER-ADMIN/ADMIN/SUB-ADMIN/CUSTOMER/PARTNER",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================ isTax ======================= 
exports.isTax = (req, res, next) => {
  try {
    if (
      (req.Admin.userType.includes(userType.admin) ===
      Object.values(userType).includes(userType.admin) ||
      req.Admin.userType.includes(userType.subAdmin) ===
        Object.values(userType).includes(userType.subAdmin) ||
      req.Admin.userType.includes(userType.superAdmin) ===
        Object.values(userType).includes(userType.superAdmin)) &&
    (req.Admin.permissions.includes(userPermissions.taxs) ||
      req.Admin.permissions.includes(userPermissions.all))
    ) {
      next();
    } else {
      return res.status(404).json({
        success: false,
        message: "YOU ARE NOT AN SUPER-ADMIN/ADMIN/SUB-ADMIN/CUSTOMER/PARTNER",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};